'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraphView } from '@/components/GraphView';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { api, GraphResponse } from '@/lib/api';
import { Play } from 'lucide-react';

export default function GraphPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchGraph = async () => {
      try {
        const data = await api.getGraph(id);
        setGraphData(data);
      } catch (err: any) {
        console.error("Error fetching graph:", err);
        setError("Failed to load knowledge graph. The session might not exist or the server is unreachable.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraph();
  }, [id]);

  const handleStartQuiz = () => {
    router.push(`/quiz/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner messages={["Decompressing semantic nodes...", "Initializing graph projection..."]} />
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20 mb-4">
          <span className="text-xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Neural Graph Offline</h2>
        <p className="text-muted-foreground">{error}</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-8 px-6 py-3 rounded-full bg-secondary/20 hover:bg-secondary/40 border border-secondary/50 transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 1 }}
      className="w-screen h-screen overflow-hidden bg-black relative"
    >
      <GraphView 
        nodesData={graphData.nodes} 
        edgesData={graphData.edges} 
      />

      <motion.div 
        initial={{ y: 100, opacity: 0, x: '-50%' }}
        animate={{ y: 0, opacity: 1, x: '-50%' }}
        transition={{ delay: 0.5, type: 'spring', damping: 20 }}
        className="absolute bottom-8 left-1/2 z-50 flex items-center justify-center pointer-events-none w-full"
      >
        <button 
          onClick={handleStartQuiz}
          className="pointer-events-auto group relative flex items-center gap-3 px-8 py-4 rounded-full bg-background/80 backdrop-blur-xl border border-primary/50 shadow-[0_0_30px_rgba(0,255,255,0.2)] hover:shadow-[0_0_50px_rgba(0,255,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
        >
          {/* Animated Gradient Border Overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/30 to-primary/0 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          
          <span className="relative z-10 font-bold text-lg tracking-wide uppercase">Start Assessment</span>
          <div className="relative z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground group-hover:bg-white transition-colors">
            <Play className="w-4 h-4 ml-0.5" />
          </div>
        </button>
      </motion.div>
    </motion.main>
  );
}
