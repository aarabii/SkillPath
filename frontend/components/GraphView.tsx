"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeSchema, EdgeSchema } from "@/lib/api";
import Dagre from "@dagrejs/dagre";

export type NodeStatus =
  | "unassessed"
  | "known"
  | "unknown"
  | "learning_path"
  | "mastered"
  | "target";

interface GraphViewProps {
  nodesData: NodeSchema[];
  edgesData: EdgeSchema[];
  nodeStatuses?: Record<string, NodeStatus>;
  onNodeClick?: (nodeId: string) => void;
}

// --- Dagre layout helper ---
const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

function getLayoutedElements(
  nodes: NodeSchema[],
  edges: EdgeSchema[],
  nodeStatuses: Record<string, NodeStatus>,
): { nodes: Node[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: "TB", // top-to-bottom hierarchy
    nodesep: 60, // horizontal gap between sibling nodes
    ranksep: 100, // vertical gap between ranks
    marginx: 30,
    marginy: 30,
  });

  // Register every node with dagre
  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Register every edge with dagre
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  // Build React Flow nodes from dagre-computed positions
  const layoutedNodes: Node[] = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      id: node.id,
      type: "custom",
      // dagre returns center coordinates; offset by half width/height for React Flow
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      data: {
        label: node.label,
        description: node.description,
        status: nodeStatuses[node.id] || "unassessed",
      },
    };
  });

  const layoutedEdges: Edge[] = edges.map((edge) => {
    // Adding some premium effects to the lines connecting nodes
    return {
      id: `e-${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: {
        stroke: "#a1a1aa",
        strokeWidth: 2,
        filter: "drop-shadow(0px 0px 2px rgba(255,255,255,0.2))",
      },
      type: "bezier",
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

// Custom Node Component
const CustomNode = ({ data, id }: any) => {
  const status: NodeStatus = data.status || "unassessed";
  const label = data.label;
  const hideMastered = data.hideMastered;

  if (hideMastered && status === "mastered") {
    return null; // Let React Flow manage 'hidden' state
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: status === "mastered" ? 0.4 : 1 }}
      className="relative flex flex-col items-center justify-center pointer-events-auto"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 w-1 h-1"
      />
      <div
        className={cn(
          "w-2 h-2 rounded-full mb-2 transition-all duration-300",
          status === "mastered" && "bg-zinc-800",
          status === "target" && "bg-white ring-2 ring-white/20",
          status === "unassessed" && "bg-zinc-600 hover:bg-zinc-400",
          status === "learning_path" && "bg-white",
          status === "known" && "bg-zinc-700",
          status === "unknown" && "bg-zinc-500",
        )}
      />
      <div className="absolute top-4 w-40 text-center z-10 bg-neutral-950/80 px-2 py-1 rounded-md backdrop-blur-md border border-white/5">
        <span className="text-xs md:text-sm font-serif font-semibold text-white tracking-widest leading-tight drop-shadow-sm">
          {label}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 w-1 h-1"
      />
    </motion.div>
  );
};

const EMPTY_STATUSES: Record<string, NodeStatus> = {};

export function GraphView({
  nodesData,
  edgesData,
  nodeStatuses = EMPTY_STATUSES,
  onNodeClick,
}: GraphViewProps) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Compute hierarchical layout via dagre
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => getLayoutedElements(nodesData, edgesData, nodeStatuses),
    [nodesData, edgesData, nodeStatuses],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [hoveredNode, setHoveredNode] = useState<NodeSchema | null>(null);
  const [hideMastered, setHideMastered] = useState(false);

  React.useEffect(() => {
    // 1. Filter out known concepts entirely if hidden
    const visibleNodesData = hideMastered
      ? nodesData.filter((n) => nodeStatuses[n.id] !== "mastered")
      : nodesData;

    // 2. Filter edges to drop dangling connections
    const visibleNodesSet = new Set(visibleNodesData.map((n) => n.id));
    const visibleEdgesData = edgesData.filter(
      (e) => visibleNodesSet.has(e.source) && visibleNodesSet.has(e.target),
    );

    // 3. Re-calculate actual positions without blanks
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      visibleNodesData,
      visibleEdgesData,
      nodeStatuses,
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [hideMastered, nodesData, edgesData, nodeStatuses, setNodes, setEdges]);

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const originalNode = nodesData.find((n) => n.id === node.id);
      if (originalNode) setHoveredNode(originalNode);
    },
    [nodesData],
  );

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick) onNodeClick(node.id);
    },
    [onNodeClick],
  );

  return (
    <div className="w-full h-full relative bg-background border border-zinc-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#333333"
        />
        <Controls className="bg-zinc-950 border-zinc-800 text-zinc-400" />

        <Panel
          position="top-left"
          className="bg-transparent border-l border-zinc-800 p-4 m-4"
        >
          <div className="text-[10px] font-sans text-zinc-400 mb-2 uppercase tracking-widest">
            Graph Stats
          </div>
          <div className="flex flex-col space-y-1 font-sans">
            <span className="text-xs text-zinc-500">
              <strong className="text-white font-normal">{nodes.length}</strong>{" "}
              Concepts
            </span>
            <span className="text-xs text-zinc-500">
              <strong className="text-white font-normal">{edges.length}</strong>{" "}
              Dependencies
            </span>
          </div>
        </Panel>

        <Panel position="top-right" className="m-4 z-50">
          <button
            onClick={() => setHideMastered(!hideMastered)}
            className="flex items-center gap-2 px-4 py-2 bg-transparent border border-zinc-800 hover:border-white/20 transition-colors text-xs font-sans tracking-widest uppercase text-zinc-400 hover:text-white"
          >
            {hideMastered ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
            {hideMastered ? "Show Mastered" : "Hide Mastered"}
          </button>
        </Panel>
      </ReactFlow>

      {/* Futuristic Floating Tooltip -> Minimalist Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-6 right-6 max-w-sm pointer-events-none z-50 bg-zinc-950 border border-zinc-800 p-5 shadow-2xl"
          >
            <h4 className="text-white font-serif text-lg mb-2">
              {hoveredNode.label}
            </h4>
            <p className="text-sm font-sans text-zinc-400 leading-relaxed">
              {hoveredNode.description ||
                "No description available for this concept."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
