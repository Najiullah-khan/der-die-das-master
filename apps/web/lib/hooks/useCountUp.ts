"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tweens a displayed number toward `target` over `durationMs` whenever it changes (score/XP
 * counter increment animation upgrade). Jumps straight to `target` on the very first render —
 * only score *changes* animate, not the initial mount.
 */
export function useCountUp(target: number, durationMs = 500): number {
  const [displayed, setDisplayed] = useState(target);
  const fromRef = useRef(target);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fromRef.current = target;
      setDisplayed(target);
      return;
    }

    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    let frame: number;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      // Ease-out cubic — quick start, gentle settle, matches the rest of the app's snappy feel.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + delta * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return displayed;
}
