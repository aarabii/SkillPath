"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GraphView } from "@/components/GraphView";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api, GraphResponse } from "@/lib/api";
import { Play } from "lucide-react";

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
        setError(
          "Failed to load knowledge graph. The session might not exist or the server is unreachable.",
        );
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
        <LoadingSpinner
          messages={[
            "Decompressing semantic nodes...",
            "Initializing graph projection...",
          ]}
        />
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="p-4 border border-zinc-800 mb-4">
          <span className="text-xl">⚠️</span>
        </div>
        <h2 className="font-serif text-2xl font-normal mb-2 text-white">
          Neural Graph Offline
        </h2>
        <p className="font-sans text-sm text-zinc-400">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-8 px-6 py-3 border border-white/20 bg-transparent hover:bg-white/5 transition-colors font-sans text-xs tracking-widest uppercase text-white"
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
      className="w-screen h-screen overflow-hidden bg-background relative"
    >
      <GraphView nodesData={graphData.nodes} edgesData={graphData.edges} />

      <motion.div
        initial={{ y: 100, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        transition={{ delay: 0.5, type: "spring", damping: 20 }}
        className="absolute bottom-8 left-1/2 z-50 flex items-center justify-center pointer-events-none w-full"
      >
        <button
          onClick={handleStartQuiz}
          className="pointer-events-auto flex items-center gap-3 px-6 py-3 border border-white/20 bg-transparent hover:bg-white hover:text-black transition-all duration-300 group"
        >
          <span className="font-sans text-[11px] tracking-[0.2em] uppercase">
            Start Assessment
          </span>
          <Play className="w-3 h-3 group-hover:text-black text-white" />
        </button>
      </motion.div>
    </motion.main>
  );
}
