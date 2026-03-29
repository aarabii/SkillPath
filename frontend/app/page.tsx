'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SkillInput } from '@/components/SkillInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { api } from '@/lib/api';
import { AlertCircle, Target, Library, Activity } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePath = async (skill: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.generateGraph({ skill });
      if (res.session_id) {
        router.push(`/graph/${res.session_id}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 md:p-24 overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-secondary/20 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-6xl mx-auto z-10">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex justify-center py-20"
          >
            <LoadingSpinner />
          </motion.div>
        ) : (
          <div className="flex flex-col items-center w-full">
            {/* Header / Logo */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute top-8 left-8 flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold tracking-widest uppercase text-sm">SkillPath</span>
            </motion.div>

            {/* Hero Section */}
            <div className="text-center w-full max-w-4xl mx-auto mt-20 md:mt-10 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
              >
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium tracking-wide text-foreground/80 uppercase">The future of accelerated learning</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1]"
              >
                Master <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-blue-400 to-secondary animate-gradient-x">Anything</span><br/>
                in Hours, Not Months.
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-12"
              >
                SkillPath builds a personalized neural knowledge graph for any topic, diagnoses your gaps through adaptive quizzes, and generates the exact optimal learning path you need.
              </motion.p>
            </div>

            {/* Input Section */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-full"
            >
              <SkillInput onSubmit={handleGeneratePath} isLoading={isLoading} />
            </motion.div>

            {/* Features (Below the fold) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl"
            >
              <FeatureCard 
                icon={<Target className="w-8 h-8 text-primary" />}
                title="Adaptive Assessment" 
                desc="Smart quizzes dynamically pinpoint exactly what you don't know, saving you from reviewing familiar material." 
              />
              <FeatureCard 
                icon={<Activity className="w-8 h-8 text-secondary" />}
                title="Neural Graphs" 
                desc="Visualize the entire prerequisite tree of your chosen skill as an interactive data structure." 
              />
              <FeatureCard 
                icon={<Library className="w-8 h-8 text-emerald-400" />}
                title="Curated Paths" 
                desc="Get an exact timeline of tutorials, videos, and articles uniquely targeted to your capability gaps." 
              />
            </motion.div>
          </div>
        )}
      </div>

      {/* Elegant Toast Error Notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-destructive/10 border border-destructive/30 backdrop-blur-xl shadow-[0_0_30px_rgba(255,50,50,0.2)]"
          >
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium text-destructive-foreground">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors duration-300">
      <div className="p-4 rounded-2xl bg-black/40 mb-6 border border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {desc}
      </p>
    </div>
  );
}
