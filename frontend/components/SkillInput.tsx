'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const EXAMPLE_SKILLS = [
  "Docker & Kubernetes",
  "LLM Architectures",
  "System Design",
  "React Server Components",
  "Quantum Computing Basics"
];

interface SkillInputProps {
  onSubmit: (skill: string) => void;
  isLoading?: boolean;
}

export function SkillInput({ onSubmit, isLoading = false }: SkillInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
    }
  };

  const handleChipClick = (skill: string) => {
    setValue(skill);
    if (!isLoading) {
      onSubmit(skill);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center space-y-12">
      {/* Massive Search Input Area */}
      <form onSubmit={handleSubmit} className="relative w-full group">
        <motion.div
          animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "relative flex items-center w-full rounded-2xl md:rounded-full bg-background/50 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-300",
            isFocused && "border-primary/50 shadow-[0_0_40px_rgba(0,255,255,0.15)] bg-background/80"
          )}
        >
          {/* Animated Glow Border Effect when Focused */}
          {isFocused && (
            <motion.div 
              className="absolute -bottom-1 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ pointerEvents: 'none' }}
            />
          )}

          <div className="pl-6 md:pl-8 text-muted-foreground hidden sm:flex items-center justify-center">
            <Sparkles className={cn("w-6 h-6 transition-colors duration-300", isFocused ? "text-primary" : "")} />
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What do you want to learn today?"
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none px-6 py-6 md:py-8 text-xl md:text-2xl font-medium text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className={cn(
              "absolute right-2 top-2 bottom-2 md:right-3 md:top-3 md:bottom-3 rounded-xl md:rounded-full px-8 md:px-10 font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden",
              !value.trim() || isLoading
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                : "bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]"
            )}
          >
            {value.trim() && !isLoading && (
               <motion.div 
                 className="absolute inset-0 w-1/2 h-full skew-x-12 bg-white/20"
                 animate={{ x: ['-200%', '400%'] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
               />
            )}
            <span className="relative z-10 hidden sm:inline-block">Generate Path</span>
            <Send className="w-5 h-5 relative z-10" />
          </button>
        </motion.div>
      </form>

      {/* Example Chips */}
      <div className="w-full flex-col flex items-center space-y-4">
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">
          Or try an example
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          {EXAMPLE_SKILLS.map((skill, index) => (
            <motion.button
              key={skill}
              disabled={isLoading}
              onClick={() => handleChipClick(skill)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, ease: "easeOut" }}
              whileHover={!isLoading ? { scale: 1.05 } : {}}
              whileTap={!isLoading ? { scale: 0.95 } : {}}
              className="px-5 py-2.5 rounded-full text-sm font-medium border border-white/5 bg-white/5 hover:bg-secondary/20 hover:border-secondary/50 hover:text-white transition-colors duration-300 backdrop-blur-sm text-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {skill}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
