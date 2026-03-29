'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api, QuestionSchema } from '@/lib/api';
import { QuizCard } from '@/components/QuizCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';

export default function QuizArena() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionSchema | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  // Progress estimation (since we don't know exact total questions upfront in an adaptive quiz, 
  // we could just fake a progressing bar, or base it on an arbitrary 'max' of 5-10 for UI purposes)
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  useEffect(() => {
    if (!id) return;

    const initQuiz = async () => {
      try {
        const res = await api.startQuiz({ session_id: id });
        setCurrentQuestion(res.question);
      } catch (err: any) {
        console.error("Quiz init failed:", err);
        setError("Failed to initialize cognitive assessment. Target might be untracked.");
      } finally {
        setIsLoading(false);
      }
    };

    initQuiz();
  }, [id]);

  const handleAnswerSubmit = async (selectedOption: string) => {
    if (!currentQuestion) throw new Error("Quiz not ready");
    
    const res = await api.submitAnswer({
      session_id: id,
      concept_id: currentQuestion.concept_id,
      answer: selectedOption,
    });

    return res;
  };

  const handleNext = (nextQuestion?: QuestionSchema, completed?: boolean) => {
    setQuestionsAnswered(prev => prev + 1);

    if (completed) {
      setIsComplete(true);
      triggerConfetti();
    } else if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
    } else {
      // Fallback if backend says string but no question (should be complete theoretically)
      setIsComplete(true);
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00ffff', '#8a2be2', '#00ff80']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00ffff', '#8a2be2', '#00ff80']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <LoadingSpinner messages={["Calibrating assessment algorithms...", "Mapping structural dependencies..."]} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-6">
        <h2 className="text-2xl font-bold text-destructive mb-4">Calibration Error</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Simulated progress percentage (caps at 95% until complete)
  const progressPct = isComplete ? 100 : Math.min(((questionsAnswered + 1) / 5) * 100, 95);

  return (
    <main className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Cinematic ambient background */}
      <div className="absolute inset-0 pointer-events-none w-full h-full opacity-30">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary blur-[150px] rounded-full mix-blend-screen opacity-20" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary blur-[150px] rounded-full mix-blend-screen opacity-20" />
      </div>

      {/* Slim Glowing Progress Bar */}
      <div className="w-full h-1 bg-white/5 relative z-50">
        <motion.div 
          className="h-full bg-primary shadow-[0_0_20px_rgba(0,255,255,0.8)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10 w-full max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {!isComplete && currentQuestion ? (
            <motion.div
              key={currentQuestion.concept_id}
              initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full"
            >
              <QuizCard 
                question={currentQuestion}
                onAnswerSubmit={handleAnswerSubmit}
                onNext={(res) => {
                  handleNext(res.next_question, res.quiz_complete);
                }}
              />
            </motion.div>
          ) : isComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center w-full max-w-2xl bg-background/50 backdrop-blur-3xl border border-white/10 p-12 rounded-3xl shadow-2xl"
            >
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(0,255,128,0.3)] border border-success/50">
                <Sparkles className="w-10 h-10 text-success" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-b from-white to-white/60">
                Assessment Complete
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                We have calibrated your baseline knowledge. Your personalized hyper-learning path is ready.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/path/${id}`)}
                className="px-10 py-5 bg-primary text-primary-foreground font-bold text-lg rounded-full shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:shadow-[0_0_50px_rgba(0,255,255,0.6)] transition-all uppercase tracking-widest"
              >
                Reveal Your Path
              </motion.button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
