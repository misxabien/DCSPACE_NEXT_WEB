"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type BrandedLoadingProps = {
  complete?: boolean;
  label?: string;
  onComplete?: () => void;
};

export function BrandedLoading({ complete = false, label = "Loading...", onComplete }: BrandedLoadingProps) {
  const [progress, setProgress] = useState(0);
  const hasCompleted = useRef(false);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progress / 100) * circumference;
  const isComplete = progress >= 100;
  const shouldPop = isComplete && Boolean(onComplete);

  useEffect(() => {
    if (complete) {
      setProgress(100);
      return;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 94) {
          return current;
        }

        const nextStep = current < 70 ? 10 : current < 88 ? 5 : 2;
        return Math.min(current + nextStep, 94);
      });
    }, 55);

    return () => window.clearInterval(interval);
  }, [complete]);

  useEffect(() => {
    if (!complete || !isComplete || hasCompleted.current) {
      return;
    }

    hasCompleted.current = true;
    const timeout = window.setTimeout(() => {
      onComplete?.();
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [complete, isComplete, onComplete]);

  return (
    <div className={`brand-loader${shouldPop ? " is-complete" : ""}`} role="status" aria-live="polite">
      <div className="brand-loader__mark">
        <svg className="brand-loader__progress" viewBox="0 0 132 132" aria-hidden="true">
          <circle className="brand-loader__track" cx="66" cy="66" r={radius} />
          <circle
            className="brand-loader__bar"
            cx="66"
            cy="66"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <Image
          src="/loading-logo.png"
          alt=""
          width={112}
          height={112}
          className="brand-loader__logo"
          priority
        />
      </div>
      <p className="brand-loader__text">{label}</p>
    </div>
  );
}
