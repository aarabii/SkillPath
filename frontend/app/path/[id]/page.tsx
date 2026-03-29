'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { api, PathResponse, GraphResponse } from '@/lib/api';
import { PathStep } from '@/components/PathStep';
import { GraphView } from '@/components/GraphView';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Share2, FileText, Check } from 'lucide-react';

export default function PathDashboard() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [pathData, setPathData] = useState<PathResponse | null>(null);
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchAllData = async () => {
      try {
        const [pathRes, graphRes] = await Promise.all([
          api.getPath({ session_id: id }),
          api.getGraph(id).catch(() => null), // Graph might not exist if mock or separate, but we try
        ]);
        setPathData(pathRes);
        setGraphData(graphRes);
      } catch (err: any) {
        console.error("Failed to load dashboard:", err);
        setError("Could not load your optimized learning path. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  const countValue = useMotionValue(0);
  const displayPercentage = useTransform(countValue, (latest) => Math.round(latest));

  useEffect(() => {
    if (pathData?.reduction_percentage) {
      animate(countValue, pathData.reduction_percentage, { duration: 2, ease: "easeOut" });
    }
  }, [pathData, countValue]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <LoadingSpinner messages={["Calculating optimal trajectory...", "Trimming redundant concepts..."]} />
      </div>
    );
  }

  if (error || !pathData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-6">
        <h2 className="text-2xl font-bold text-destructive mb-4">Dashboard Error</h2>
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

  const totalMinutes = pathData.steps.reduce((sum, s) => sum + s.estimated_minutes, 0);
  const hoursSaved = Math.round((totalMinutes * (pathData.reduction_percentage / 100)) / 60);

  return (
    <main className="min-h-screen bg-black flex flex-col md:flex-row pt-16 md:pt-0">
      {/* Left Column: Timeline */}
      <div className="w-full md:w-1/2 flex flex-col h-full min-h-screen border-r border-white/10 bg-background/50 relative px-6 md:px-16 py-12 md:py-24 overflow-y-auto hidden-scrollbar">
        <div className="max-w-xl mx-auto w-full">
          {/* Hero Stat */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/20 border border-success/30 text-success text-sm font-bold tracking-wide uppercase mb-6">
              <SparklesIcon className="w-4 h-4" />
              Optimized Path Ready
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-foreground leading-[1.1]">
              You saved <br className="hidden md:block"/>
              <motion.span className="text-transparent bg-clip-text bg-linear-to-r from-success to-primary pr-2">
                {displayPercentage}
              </motion.span>
              <span className="text-transparent bg-clip-text bg-linear-to-r from-success to-primary">% of your time</span>
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Based on your assessment, we trimmed {hoursSaved > 0 ? `${hoursSaved} hours` : 'unnecessary concepts'} of redundant material. Here is your hyper-focused curriculum.
            </p>

            <div className="flex items-center gap-4 mt-8">
              <button 
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors font-medium backdrop-blur-md"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Copied Link' : 'Share Path'}
              </button>
            </div>
          </motion.div>

          {/* Timeline Steps */}
          <div className="flex flex-col space-y-2">
            {pathData.steps.map((step, index) => (
              <PathStep 
                key={step.concept_id} 
                step={step} 
                index={index} 
                isLast={index === pathData.steps.length - 1} 
              />
            ))}
          </div>
          
          <div className="mt-16 text-center text-sm text-muted-foreground bg-white/5 rounded-2xl p-6 border border-white/5">
            <h4 className="font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Curriculum Complete
            </h4>
            <p>You have reached the end of the optimized path. Mastering these concepts provides the foundation needed for this skill.</p>
          </div>
        </div>
      </div>

      {/* Right Column: Mini Map */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-screen sticky top-0 bg-background hidden md:block border-l border-white/5">
        {graphData ? (
          <GraphView 
            nodesData={graphData.nodes} 
            edgesData={graphData.edges} 
            // We highlight the nodes in the path
            nodeStatuses={
              graphData.nodes.reduce((acc, node) => {
                const inPath = pathData.steps.find(p => p.concept_id === node.id);
                acc[node.id] = inPath ? 'learning_path' : 'known';
                return acc;
              }, {} as Record<string, any>)
            }
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black">
            <div className="p-4 bg-white/5 rounded-full mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-mono">Map unavailable.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}
