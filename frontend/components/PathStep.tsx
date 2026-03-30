'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PathStepSchema } from '@/lib/api';
import { PlayCircle, FileText, BookOpen, Clock, Library, Check, Target } from 'lucide-react';

interface PathStepProps {
  step: PathStepSchema;
  index: number;
  isLast: boolean;
}

function extractYouTubeId(url: string) {
  const match = url.match(/[?&]v=([^&]+)/);
  if (match) return match[1];
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];
  return 'default';
}

export function PathStep({ step, index, isLast }: PathStepProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isMastered = step.status === 'mastered';
  
  const badgeStyles = isMastered 
    ? {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        icon: <Check className="w-4 h-4 mr-1 text-emerald-400" />
      }
    : {
        bg: 'bg-primary/20',
        border: 'border-primary/30',
        text: 'text-primary',
        icon: <Target className="w-4 h-4 mr-1 text-primary" />
      };

  return (
    <div 
      className="relative flex items-start group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Timeline Tracking Line */}
      {!isLast && (
        <div className="absolute left-[27px] top-14 bottom-[-16px] w-[2px] overflow-hidden -ml-px">
          <div className="w-full h-full bg-white/10" />
          {/* Animated glowing segment that moves down */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={isHovered ? { y: '200%' } : { y: '-100%' }}
            transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-transparent via-primary/80 to-transparent shadow-[0_0_10px_rgba(0,255,255,0.8)]"
          />
        </div>
      )}

      {/* Step Number Badge */}
      <div className="shrink-0 relative z-10 w-14 h-14 rounded-full bg-background/80 border border-white/10 shadow-lg flex items-center justify-center mr-6 backdrop-blur-md transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-b from-white to-white/50">
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
        <div className="bg-background/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:bg-background/60 hover:border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h3 className="text-2xl font-semibold text-foreground tracking-tight">
              {step.concept_label}
            </h3>
            <div className={cn("inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm w-max", badgeStyles.bg, badgeStyles.border, badgeStyles.text)}>
              {badgeStyles.icon}
              {isMastered ? 'Mastered' : 'Target'}
            </div>
          </div>
          
          <p className="text-muted-foreground text-base leading-relaxed mb-6 max-w-2xl">
            {step.reason}
          </p>

          {/* Resource Link Card */}
          {isMastered ? (
            <div className="block relative overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-emerald-400">Concept Mastered</span>
                    <span className="text-xs text-emerald-500/70 mt-0.5">
                      You already know this concept
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 hidden-scrollbar pb-4 pt-2 -mx-2 px-2">
              {step.resources?.map((res, i) => {
                const url = res.href || res.url;
                const isVideo = url.includes('youtube.com') || url.includes('youtu.be');
                return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 w-[280px] rounded-xl border border-white/10 bg-black/40 hover:border-primary/50 hover:bg-black/60 transition-all group flex flex-col overflow-hidden shadow-lg">
                  <div className="w-full h-[140px] bg-white/5 relative border-b border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {res.image || isVideo ? (
                      <img src={res.image || (isVideo ? `https://img.youtube.com/vi/${extractYouTubeId(url)}/mqdefault.jpg` : '')} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-primary/20 to-black flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                       {isVideo ? (
                         <PlayCircle className="w-12 h-12 text-white/0 group-hover:text-white drop-shadow-lg transition-colors duration-300" />
                       ) : (
                         <Library className="w-10 h-10 text-white/0 group-hover:text-white drop-shadow-lg transition-colors duration-300" />
                       )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col flex-1 p-5">
                    <h4 className="text-sm font-semibold line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors leading-relaxed mb-2">
                       {res.title}
                    </h4>
                    {res.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                        {res.description}
                      </p>
                    )}
                    
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-auto pt-3 flex items-center gap-1.5 border-t border-white/5">
                       {isVideo ? <PlayCircle className="w-3 h-3 text-red-500" /> : <BookOpen className="w-3 h-3 text-primary" />} 
                       <span className="truncate">{url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}</span>
                    </div>
                  </div>
                </a>
              )})}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
