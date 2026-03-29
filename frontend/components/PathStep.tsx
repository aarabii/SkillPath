'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PathStepSchema } from '@/lib/api';
import { PlayCircle, FileText, BookOpen, Clock, ExternalLink } from 'lucide-react';

interface PathStepProps {
  step: PathStepSchema;
  index: number;
  isLast: boolean;
}

const getBadgeStyles = (type: string) => {
  switch (type.toLowerCase()) {
    case 'video':
      return {
        bg: 'bg-linear-to-r from-blue-500/20 to-purple-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        icon: <PlayCircle className="w-4 h-4 mr-1 text-blue-400!" />
      };
    case 'article':
      return {
        bg: 'bg-linear-to-r from-emerald-500/20 to-teal-500/20',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        icon: <FileText className="w-4 h-4 mr-1 text-emerald-400!" />
      };
    case 'doc':
    default:
      return {
        bg: 'bg-linear-to-r from-orange-500/20 to-red-500/20',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        icon: <BookOpen className="w-4 h-4 mr-1 text-orange-400!" />
      };
  }
};

export function PathStep({ step, index, isLast }: PathStepProps) {
  const [isHovered, setIsHovered] = useState(false);
  const badgeStyles = getBadgeStyles(step.resource_type);

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
              {step.resource_type}
            </div>
          </div>
          
          <p className="text-muted-foreground text-base leading-relaxed mb-6 max-w-2xl">
            {step.reason}
          </p>

          {/* Resource Link Card */}
          <a 
            href={step.resource_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group/link block relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover/link:bg-primary/20 transition-colors">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground/90 group-hover/link:text-primary transition-colors">Start Learning</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    Est. {step.estimated_minutes} mins
                  </span>
                </div>
              </div>
              <motion.div
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover/link:bg-primary/10"
                whileHover={{ scale: 1.1, x: 5 }}
              >
                <ArrowRightIcon className="w-4 h-4 text-muted-foreground group-hover/link:text-primary transition-colors" />
              </motion.div>
            </div>
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function ArrowRightIcon(props: any) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
