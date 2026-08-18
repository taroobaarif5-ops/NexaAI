"use client";

import { useEffect, useState } from "react";
import BrandMark from "./BrandMark";

type SplashScreenProps = {
  onComplete: () => void;
};

export default function SplashScreen({
  onComplete,
}: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);

      setTimeout(() => {
        onComplete();
      }, 500);
    }, 1100);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b0e0c] opacity-0 transition-opacity duration-500" />
    );
  }

  return (
    <div className="splash-screen fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0e0c] text-white">
      <div className="splash-mark rounded-[28px] border border-[#2f4235] bg-[#151c17] p-3 shadow-2xl shadow-[#4ac970]/10"><BrandMark className="h-20 w-20" /></div>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Nexora</h1>
      <p className="mt-2 text-sm text-[#8c9a90]">AI Workspace</p>
      <span className="mt-6 h-px w-12 bg-[#59cb7d]" />
    </div>
  );
}
