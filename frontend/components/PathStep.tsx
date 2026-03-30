"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PathStepSchema } from "@/lib/api";
import { PlayCircle, Library, Check, Target } from "lucide-react";

interface PathStepProps {
  step: PathStepSchema;
  index: number;
  isLast: boolean;
}

export function PathStep({ step, index, isLast }: PathStepProps) {
  const isMastered = step.status === "mastered";

  const badgeStyles = isMastered
    ? {
        bg: "bg-emerald-500/5",
        border: "border-emerald-500/20",
        text: "text-emerald-400/80",
        icon: <Check className="w-3 h-3 mr-1 text-emerald-400/80" />,
      }
    : {
        bg: "bg-indigo-500/5",
        border: "border-indigo-500/20",
        text: "text-indigo-300/80",
        icon: <Target className="w-3 h-3 mr-1 text-indigo-300/80" />,
      };

  return (
    <div className="relative flex items-start group">
      {/* Timeline Tracking Line */}
      {!isLast && (
        <div className="absolute left-6.75 top-14 -bottom-4 w-px bg-indigo-950/50 -ml-px" />
      )}

      {/* Step Number Badge */}
      <div className="shrink-0 relative z-10 w-14 h-14 bg-transparent border border-zinc-800 flex items-center justify-center mr-6 transition-all duration-300 group-hover:border-indigo-500/40 group-hover:shadow-[0_0_15px_-3px_rgba(99,102,241,0.15)]">
        <span className="text-sm font-sans font-normal text-white group-hover:text-indigo-200 transition-colors">
          {index + 1}
        </span>
      </div>

      {/* Content Card */}
      <motion.div
        className="flex-1 pb-10"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <div className="bg-transparent border-l border-zinc-800 p-6 md:p-8 transition-all duration-300 hover:border-indigo-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h3 className="text-2xl font-serif text-white tracking-tight group-hover:text-indigo-50 transition-colors">
              {step.concept_label}
            </h3>
            <div
              className={cn(
                "inline-flex items-center px-3 py-1 border text-[10px] uppercase font-sans tracking-widest w-max",
                badgeStyles.bg,
                badgeStyles.border,
                badgeStyles.text,
              )}
            >
              {badgeStyles.icon}
              {isMastered ? "Mastered" : "Target"}
            </div>
          </div>

          <p className="font-sans text-sm text-zinc-400 leading-relaxed mb-6 max-w-2xl">
            {step.reason}
          </p>

          {/* Resource Link Card */}
          {isMastered ? (
            <div className="block relative overflow-hidden border-t border-zinc-800 pt-4 mt-4 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border border-zinc-800 flex items-center justify-center">
                    <Check className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-sans text-zinc-500 uppercase tracking-widest">
                      Concept Mastered
                    </span>
                    <span className="text-xs text-zinc-600 mt-0.5">
                      You already know this concept
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2 max-h-80 overflow-y-auto pr-2 styled-scrollbar">
              {step.resources?.map((res, i) => {
                const url = res.href || res.url;
                const isVideo =
                  url.includes("youtube.com") || url.includes("youtu.be");
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 border border-zinc-800 hover:border-indigo-500/30 transition-all group/link hover:bg-indigo-500/5 hover:shadow-[0_0_15px_-3px_rgba(99,102,241,0.1)] mb-2"
                  >
                    <div className="shrink-0 w-8 h-8 flex items-center justify-center border border-zinc-800 text-zinc-500 group-hover/link:text-indigo-400 group-hover/link:border-indigo-500/30 transition-colors">
                      {isVideo ? (
                        <PlayCircle className="w-4 h-4" />
                      ) : (
                        <Library className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <h4 className="text-sm font-sans font-normal text-zinc-200 group-hover/link:text-indigo-100 transition-colors leading-relaxed mb-1 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 group-hover/link:bg-indigo-500/20 text-[10px] text-zinc-400 group-hover/link:text-indigo-300 font-medium transition-colors">
                          {i + 1}
                        </span>
                        {res.title}
                      </h4>
                      {res.description && (
                        <p className="text-xs font-sans text-zinc-500 line-clamp-2 leading-relaxed mb-2">
                          {res.description}
                        </p>
                      )}

                      <div className="text-[10px] font-sans uppercase tracking-widest text-zinc-600 flex items-center gap-1.5 mt-1">
                        <span className="truncate">
                          {
                            url
                              .replace(/^https?:\/\//, "")
                              .replace(/^www\./, "")
                              .split("/")[0]
                          }
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
