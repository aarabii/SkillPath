'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { QuestionSchema, QuizAnswerResponse } from '@/lib/api';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface QuizCardProps {
  question: QuestionSchema;
  onAnswerSubmit: (selectedOption: string) => Promise<QuizAnswerResponse>;
  onNext: (result: QuizAnswerResponse) => void;
  isSubmitting?: boolean;
}

export function QuizCard({ question, onAnswerSubmit, onNext, isSubmitting = false }: QuizCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<QuizAnswerResponse | null>(null);

  const handleSelect = async (option: string) => {
    if (selectedOption || isSubmitting) return; // Prevent multiple clicks
    setSelectedOption(option);
    
    // Call the API handler and await result
    try {
      const res = await onAnswerSubmit(option);
      setResult(res);
    } catch (e) {
      // Revert if error occurs so user can try again
      setSelectedOption(null);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col space-y-6">
      {/* Question Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase tracking-widest text-xs font-bold mb-6">
          {question.concept_label}
        </div>
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground/90 leading-snug glass-text pb-4">
          {question.question}
        </h2>
      </motion.div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-4 mt-6">
        {Object.entries(question.options).map(([key, text], idx) => {
          const isSelected = selectedOption === key;
          const isAnswered = selectedOption !== null;
          
          let stateStyles = "hover:bg-white/10 hover:border-white/20 text-foreground/80 cursor-pointer";
          let icon = null;

          if (isAnswered) {
            if (isSelected) {
              if (result?.correct) {
                stateStyles = "bg-success/20 border-success shadow-[0_0_20px_rgba(0,255,128,0.3)] text-success-foreground pointer-events-none";
                icon = <CheckCircle2 className="w-6 h-6 text-success" />;
              } else if (result?.correct === false) {
                stateStyles = "bg-destructive/20 border-destructive shadow-[0_0_20px_rgba(255,50,50,0.3)] text-destructive-foreground pointer-events-none";
                icon = <XCircle className="w-6 h-6 text-destructive" />;
              } else {
                stateStyles = "bg-primary/20 border-primary shadow-[0_0_15px_rgba(0,255,255,0.2)] text-primary-foreground pointer-events-none";
              }
            } else {
              stateStyles = "opacity-50 pointer-events-none border-white/5 bg-background/30";
            }
          }

          return (
            <motion.button
              key={key}
              disabled={isAnswered || isSubmitting}
              onClick={() => handleSelect(key)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              whileHover={!isAnswered && !isSubmitting ? { x: 5 } : {}}
              whileTap={!isAnswered && !isSubmitting ? { scale: 0.98 } : {}}
              className={cn(
                "w-full text-left p-6 rounded-2xl border border-white/10 bg-background/50 backdrop-blur-md transition-all duration-300 ease-out flex items-center justify-between",
                stateStyles
              )}
            >
              <span className="text-lg font-medium pr-4"><span className="font-bold text-primary mr-3">{key}.</span>{text}</span>
              {icon}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation & Next Slide-up Panel */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 40, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 40, height: 0 }}
            className="overflow-hidden bg-background/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl mt-8"
          >
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <h4 className={cn("text-xl font-bold mb-2 flex flex-row items-center gap-2", result.correct ? "text-success" : "text-destructive")}>
                  {result.correct ? 'Concept Mastered!' : 'Learning Opportunity!'}
                </h4>
                <p className="text-foreground/80 leading-relaxed text-base">
                  {result.explanation}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNext(result)}
                className="w-full md:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold tracking-wide shadow-[0_0_20px_rgba(0,255,255,0.4)] flex items-center justify-center gap-2 shrink-0 group hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
