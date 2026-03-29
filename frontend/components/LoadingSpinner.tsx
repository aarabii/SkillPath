'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultLoadingMessages = [
  "Analyzing knowledge vectors...",
  "Generating neural graph...",
  "Synthesizing learning paths...",
  "Connecting concepts...",
  "Preparing your curriculum...",
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
    <div className="flex flex-col items-center justify-center space-y-8 p-12 min-h-[400px]">
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Outer glowing pulse ring */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full border border-primary/30"
          style={{ boxShadow: '0 0 30px 10px rgba(0, 255, 255, 0.1)' }}
        />
        
        {/* Core rotating shapes */}
        <motion.div 
          animate={{ 
            rotate: 360,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          className="relative w-16 h-16"
        >
          {/* Cyan Square */}
          <motion.div
            className="absolute inset-0 border-2 border-primary opacity-80 rounded-md"
            style={{ boxShadow: '0 0 15px 2px rgba(0, 255, 255, 0.5)' }}
            animate={{
              rotate: [0, 90],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Purple Rotated Square */}
          <motion.div
            className="absolute inset-0 border-2 border-secondary opacity-80 rounded-md rotate-45"
            style={{ boxShadow: '0 0 15px 2px rgba(138, 43, 226, 0.5)' }}
            animate={{
              rotate: [45, -45],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>

      <div className="h-8 relative w-full max-w-sm flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute text-center text-sm tracking-widest uppercase text-primary font-mono glow-text-sm"
          >
            {messages[currentMessageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
