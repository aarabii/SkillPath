'use client';

import React, { useCallback, useMemo, useState } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeSchema, EdgeSchema } from '@/lib/api';
import Dagre from '@dagrejs/dagre';

export type NodeStatus = 'unassessed' | 'known' | 'unknown' | 'learning_path' | 'mastered' | 'target';

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
    rankdir: 'TB',       // top-to-bottom hierarchy
    nodesep: 60,         // horizontal gap between sibling nodes
    ranksep: 100,        // vertical gap between ranks
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
      type: 'custom',
      // dagre returns center coordinates; offset by half width/height for React Flow
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      data: {
        label: node.label,
        description: node.description,
        status: nodeStatuses[node.id] || 'unassessed',
      },
    };
  });

  const layoutedEdges: Edge[] = edges.map((edge) => ({
    id: `e-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    animated: true,
    style: { stroke: 'hsl(180 100% 50% / 0.5)', strokeWidth: 2 },
    type: 'smoothstep',
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

// Custom Node Component
const CustomNode = ({ data, id }: any) => {
  const status: NodeStatus = data.status || 'unassessed';
  const label = data.label;
  const hideMastered = data.hideMastered;

  if (hideMastered && status === 'mastered') {
    return null; // Let React Flow manage 'hidden' state
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: status === 'mastered' ? 0.6 : 1 }}
      className={cn(
        "relative px-4 py-3 rounded-xl border bg-background/80 backdrop-blur-xl shadow-lg min-w-[150px] text-center transition-all duration-300",
        status === 'mastered' && "bg-[hsl(0,0%,15%)] border-white/5 shadow-none pointer-events-none cursor-default",
        status === 'target' && "border-primary/50 shadow-[0_0_15px_rgba(0,255,255,0.2)] bg-primary/10 cursor-pointer hover:border-primary",
        status === 'unassessed' && "border-white/10 hover:border-white/30",
        status === 'learning_path' && "border-primary/50 shadow-[0_0_15px_rgba(0,255,255,0.2)] bg-primary/10 cursor-pointer",
        status === 'known' && "border-success/50 bg-success/10",
        status === 'unknown' && "border-destructive/50 bg-destructive/10"
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="text-sm font-medium tracking-wide">
        {label}
        {status === 'mastered' && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
            Mastered
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </motion.div>
  );
};

const EMPTY_STATUSES: Record<string, NodeStatus> = {};

export function GraphView({ nodesData, edgesData, nodeStatuses = EMPTY_STATUSES, onNodeClick }: GraphViewProps) {
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
      ? nodesData.filter((n) => nodeStatuses[n.id] !== 'mastered')
      : nodesData;

    // 2. Filter edges to drop dangling connections
    const visibleNodesSet = new Set(visibleNodesData.map((n) => n.id));
    const visibleEdgesData = edgesData.filter(
      (e) => visibleNodesSet.has(e.source) && visibleNodesSet.has(e.target)
    );

    // 3. Re-calculate actual positions without blanks
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      visibleNodesData,
      visibleEdgesData,
      nodeStatuses
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [hideMastered, nodesData, edgesData, nodeStatuses, setNodes, setEdges]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    const originalNode = nodesData.find(n => n.id === node.id);
    if (originalNode) setHoveredNode(originalNode);
  }, [nodesData]);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (onNodeClick) onNodeClick(node.id);
  }, [onNodeClick]);

  return (
    <div className="w-full h-full relative bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5">
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
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="rgba(255,255,255,0.05)" />
        <Controls className="bg-background/50 border-white/10 backdrop-blur-md fill-white" />
        
        <Panel position="top-left" className="bg-background/50 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-xl m-4">
          <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Graph Stats</div>
          <div className="flex flex-col space-y-1">
            <span className="text-sm"><strong className="text-foreground">{nodes.length}</strong> Concepts</span>
            <span className="text-sm"><strong className="text-foreground">{edges.length}</strong> Dependencies</span>
          </div>
        </Panel>

        <Panel position="top-right" className="m-4 z-50">
          <button
            onClick={() => setHideMastered(!hideMastered)}
            className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl hover:bg-white/5 transition-colors text-sm font-medium"
          >
            {hideMastered ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-primary" />}
            {hideMastered ? 'Show Mastered' : 'Hide Mastered'}
          </button>
        </Panel>
      </ReactFlow>

      {/* Futuristic Floating Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-6 right-6 max-w-sm pointer-events-none z-50 bg-background/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl"
          >
            <h4 className="text-primary font-bold mb-2">{hoveredNode.label}</h4>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {hoveredNode.description || "No description available for this concept."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
