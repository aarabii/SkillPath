"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_EXAMPLE_SKILLS = [
  "Philosophy",
  "Machine Learning",
  "Robotics",
  "Driving",
  "Cooking",
  "Photography",
  "Astrophysics",
  "Public Speaking",
  "Woodworking",
  "First Aid",
  "Chess",
  "Yoga",
  "Cryptography",
  "Game Theory",
  "Origami",
  "Spanish Language",
  "Python Programming",
  "Sailing",
  "Gardening",
  "Negotiation",
  "Music Theory",
  "Pottery",
  "Investing",
  "Video Editing",
  "Graphic Design",
];

interface SkillInputProps {
  onSubmit: (skill: string) => void;
  isLoading?: boolean;
}

export function SkillInput({ onSubmit, isLoading = false }: SkillInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [exampleSkills, setExampleSkills] = useState<string[]>([]);

  useEffect(() => {
    // Use a timeout to avoid synchronous setState inside an effect (prevents cascading renders)
    const timer = setTimeout(() => {
      const shuffled = [...ALL_EXAMPLE_SKILLS].sort(() => 0.5 - Math.random());
      setExampleSkills(shuffled.slice(0, 5));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
          animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "relative flex items-center w-full bg-transparent border-b transition-all duration-300",
            isFocused
              ? "border-indigo-400/50 shadow-[0_4px_24px_-10px_rgba(99,102,241,0.2)]"
              : "border-zinc-800",
          )}
        >
          <div className="pl-4 text-zinc-500 hidden sm:flex items-center justify-center">
            <Sparkles
              className={cn(
                "w-5 h-5 transition-colors duration-300",
                isFocused ? "text-indigo-400" : "",
              )}
            />
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What do you want to learn today?"
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none px-6 py-4 md:py-6 text-xl md:text-2xl font-serif text-white placeholder:text-zinc-600 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className={cn(
              "font-sans text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 px-6",
              !value.trim() || isLoading
                ? "text-zinc-600 cursor-not-allowed"
                : "text-indigo-300 hover:text-indigo-100",
            )}
          >
            <span className="hidden sm:inline-block">Generate Path</span>
            <Send className="w-4 h-4" />
          </button>
        </motion.div>
      </form>

      {/* Example Chips */}
      <div className="w-full flex flex-col items-center space-y-4">
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">
          Or try an example
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 min-h-10">
          {exampleSkills.map((skill, index) => (
            <motion.button
              key={skill}
              disabled={isLoading}
              onClick={() => handleChipClick(skill)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, ease: "easeOut" }}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              className="px-4 py-2 text-[11px] font-sans tracking-widest uppercase border border-zinc-800 bg-transparent hover:bg-indigo-500/5 hover:border-indigo-500/30 hover:text-indigo-200 hover:shadow-[0_0_15px_-3px_rgba(99,102,241,0.15)] transition-all duration-300 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {skill}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
