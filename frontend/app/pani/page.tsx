"use client";

import React, { useEffect } from "react";

export default function PaniPage() {
  useEffect(() => {
    // Redirect entirely to the YouTube link automatically
    window.location.href = "https://youtu.be/1Mjb-dPLfLc";
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="font-sans text-sm tracking-widest uppercase text-zinc-500">
          Redirecting...
        </p>
      </div>
    </div>
  );
}
