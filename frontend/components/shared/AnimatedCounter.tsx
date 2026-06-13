"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useInView, motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export default function AnimatedCounter({
  value,
  duration = 1.5,
  prefix = "",
  suffix = "",
  className = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0.1,
  });
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, motionValue, value]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent =
          prefix +
          latest.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          suffix;
      }
    });
    return unsubscribe;
  }, [springValue, prefix, suffix, decimals]);

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>;
}
