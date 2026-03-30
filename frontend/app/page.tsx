"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SkillInput } from "@/components/SkillInput";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePath = async (skill: string) => {
    setIsLoading(true);
    try {
      const res = await api.generateGraph({ skill });
      if (res.session_id) {
        router.push(`/graph/${res.session_id}`);
      } else {
        throw new Error("Invalid response from server");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Path generation failed:", err);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 md:p-24 overflow-x-hidden bg-background">
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
              <span className="font-serif font-bold tracking-[0.2em] uppercase text-xs text-white">
                SkillPath
              </span>
            </motion.div>

            {/* Hero Section */}
            <div className="text-center w-full max-w-4xl mx-auto mt-20 md:mt-10 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 mb-8"
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                <span className="text-[10px] font-sans tracking-widest text-zinc-400 uppercase">
                  The future of accelerated learning
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-white mb-8 leading-[1.1]"
              >
                Skill Path
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="font-sans text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-12"
              >
                Explore the shortest distance betwee you and mastery.
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
          </div>
        )}
      </div>
    </main>
  );
}
