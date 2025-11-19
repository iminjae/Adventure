"use client";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function ParallaxOrbs(){
  const mx = useMotionValue(0), my = useMotionValue(0);
  useEffect(()=>{
    const onMove = (e: MouseEvent)=>{
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mx.set(x); my.set(y);
    };
    window.addEventListener("mousemove", onMove);
    return ()=> window.removeEventListener("mousemove", onMove);
  }, [mx,my]);

  const x1 = useTransform(mx, v => v * 20), y1 = useTransform(my, v => v * 30);
  const x2 = useTransform(mx, v => v * -15), y2 = useTransform(my, v => v * -20);

  return (
    <div className="bg-adventure">
      {/* subtle stars */}
      {Array.from({length: 40}).map((_,i)=>(
        <span key={i}
          className="bg-star"
          style={{
            left: `${(i*37)%100}%`, top: `${(i*19)%100}%`,
            animationDuration: `${6 + (i%6)}s`
          }}
        />
      ))}
      {/* gradient orbs */}
      <motion.div
        className="absolute -top-20 -right-10 w-[420px] h-[420px] rounded-full"
        style={{ x: x1, y: y1, background: "radial-gradient(closest-side, rgba(124,58,237,.35), transparent 70%)" }}
      />
      <motion.div
        className="absolute top-[50%] -left-20 w-[520px] h-[520px] rounded-full"
        style={{ x: x2, y: y2, background: "radial-gradient(closest-side, rgba(34,211,238,.25), transparent 70%)" }}
      />
    </div>
  );
}