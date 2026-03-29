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
import { cn } from '@/lib/utils';
import { NodeSchema, EdgeSchema } from '@/lib/api';
import Dagre from '@dagrejs/dagre';

export type NodeStatus = 'unassessed' | 'known' | 'unknown' | 'learning_path';

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

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "relative px-4 py-3 rounded-xl border border-white/10 bg-background/80 backdrop-blur-xl shadow-lg min-w-[150px] text-center transition-all duration-300",
        status === 'known' && "border-success/50 shadow-[0_0_15px_rgba(0,255,128,0.2)] bg-success/10",
        status === 'unknown' && "border-destructive/50 shadow-[0_0_15px_rgba(255,50,50,0.2)] bg-destructive/10",
        status === 'learning_path' && "border-primary/50 shadow-[0_0_15px_rgba(0,255,255,0.2)] bg-primary/10",
        status === 'unassessed' && "hover:border-white/30"
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="text-sm font-medium tracking-wide">
        {label}
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </motion.div>
  );
};

export function GraphView({ nodesData, edgesData, nodeStatuses = {}, onNodeClick }: GraphViewProps) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Compute hierarchical layout via dagre
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => getLayoutedElements(nodesData, edgesData, nodeStatuses),
    [nodesData, edgesData, nodeStatuses],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [hoveredNode, setHoveredNode] = useState<NodeSchema | null>(null);

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
