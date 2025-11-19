"use client";
import { useEffect, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";

type ConfettiProps = { show: boolean; onDone?: () => void; count?: number; durationMs?: number };
export default function Confetti({ show, onDone, count = 40, durationMs = 900 }: ConfettiProps) {
  const controls = useAnimation();
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x0: (Math.random() * 80) - 40,           // 시작 x 오프셋
      y0: (Math.random() * 20) + 10,           // 시작 y 오프셋
      x1: (Math.random() * 240) - 120,         // 끝 x 오프셋
      y1: (Math.random() * -220) - 120,        // 끝 y 오프셋(위로)
      r:  Math.random() * 6 + 4,               // 원 크기
      d:  Math.random() * 0.6 + 0.4,           // 지연
      c:  Math.random() > 0.5 ? "#8b5cf6" : "#22d3ee" // 색
    }));
  }, [count]);

  useEffect(() => {
    if (!show) return;
    controls.set({ opacity: 1 });
    controls.start(async () => {
      await Promise.all(
        particles.map((p) =>
          controls.start({
            x: [p.x0, p.x1],
            y: [p.y0, p.y1],
            rotate: [0, Math.random() * 360],
            transition: { duration: durationMs / 1000, delay: p.d, ease: "easeOut" }
          })
        )
      );
      await controls.start({ opacity: 0, transition: { duration: 0.2 } });
      onDone?.();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <div className="absolute inset-0 flex items-center justify-center">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            animate={controls}
            initial={{ x: 0, y: 0, opacity: 0 }}
            style={{
              width: p.r, height: p.r, borderRadius: 9999,
              background: p.c, boxShadow: "0 0 8px rgba(255,255,255,.25)"
            }}
          />
        ))}
      </div>
    </div>
  );
}