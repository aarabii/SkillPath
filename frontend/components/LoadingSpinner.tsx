"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const defaultLoadingMessages = [
  "Analyzing...",
  "Generating...",
  "Synthesizing...",
  "Connecting...",
  "Preparing...",
];

export function LoadingSpinner({
  messages = defaultLoadingMessages,
}: {
  messages?: string[];
}) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const intervalId = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-12 min-h-100">
      <div className="relative flex items-center justify-center w-8 h-8">
        <motion.div
          className="absolute inset-0 border border-white"
          animate={{
            rotate: [0, 90, 180],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="h-4 relative w-full max-w-sm flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute text-center text-[10px] tracking-[0.2em] uppercase text-zinc-500 font-sans"
          >
            {messages[currentMessageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
