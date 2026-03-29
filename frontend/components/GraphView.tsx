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

export type NodeStatus = 'unassessed' | 'known' | 'unknown' | 'learning_path';

interface GraphViewProps {
  nodesData: NodeSchema[];
  edgesData: EdgeSchema[];
  nodeStatuses?: Record<string, NodeStatus>;
  onNodeClick?: (nodeId: string) => void;
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

  const initialNodes: Node[] = nodesData.map((node, index) => {
    // Simple layout logic for now, ideally backend passes layout or we use dagre for DAG layout
    // We will scatter them randomly or in a grid just for initialization if layout isn't provided
    // but typically a DAG layout is used. Assuming we just do a simple vertical stagger for presentation
    const x = (index % 3) * 200;
    const y = Math.floor(index / 3) * 150;
    
    return {
      id: node.id,
      type: 'custom',
      position: { x, y },
      data: {
        label: node.label,
        description: node.description,
        status: nodeStatuses[node.id] || 'unassessed',
      },
    };
  });

  const initialEdges: Edge[] = edgesData.map((edge, index) => ({
    id: `e-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    animated: true,
    style: { stroke: 'hsl(180 100% 50% / 0.5)', strokeWidth: 2 },
    type: 'smoothstep',
  }));

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
