/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api, QuestionSchema } from "@/lib/api";
import { QuizCard } from "@/components/QuizCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import confetti from "canvas-confetti";
import { Sparkles } from "lucide-react";

export default function QuizArena() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<QuestionSchema | null>(
    null,
  );
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!id) return;

    const initQuiz = async () => {
      try {
        const res = await api.startQuiz({ session_id: id });
        setCurrentQuestion(res.question);
      } catch (err: any) {
        console.error("Quiz init failed:", err);
        setError(
          "Failed to initialize cognitive assessment. Target might be untracked.",
        );
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
        colors: ["#ffffff", "#888888", "#aaaaaa"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ffffff", "#888888", "#aaaaaa"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner
          messages={[
            "Calibrating assessment algorithms...",
            "Mapping structural dependencies...",
          ]}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-center p-6">
        <h2 className="text-2xl font-serif text-white mb-4">
          Calibration Error
        </h2>
        <p className="text-zinc-400">{error}</p>
      </div>
    );
  }

  // Real progress from the API (assessed / total concepts)
  const progressPct = isComplete
    ? 100
    : currentQuestion
      ? Math.round(
          (currentQuestion.progress.assessed /
            Math.max(currentQuestion.progress.total, 1)) *
            100,
        )
      : 0;

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Slim Progress Bar */}
      <div className="w-full h-px bg-white/5 relative z-50">
        <motion.div
          className="h-full bg-white"
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center w-full max-w-2xl border border-white/10 p-12 bg-zinc-900/50 backdrop-blur-sm"
            >
              <div className="w-16 h-16 border border-white/20 flex items-center justify-center mx-auto mb-8">
                <Sparkles className="w-6 h-6 text-zinc-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-serif mb-6 text-white">
                Assessment Complete
              </h1>
              <p className="text-lg text-zinc-400 mb-10 leading-relaxed font-sans">
                We have calibrated your baseline knowledge. Your personalized
                learning path is ready.
              </p>
              <motion.button
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/path/${id}`)}
                className="px-8 py-4 border border-white/20 text-white font-sans text-sm tracking-widest uppercase transition-colors hover:border-white/40"
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
