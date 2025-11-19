"use client";
import { motion } from "framer-motion";

export default function ProgressRing({ size=140, stroke=12, progress=0, label="" }:{
  size?:number; stroke?:number; progress?:number; label?:string;
}){
  const r=(size-stroke)/2, c=2*Math.PI*r, dash=c*(1-Math.min(Math.max(progress,0),1));
  return (
    <div style={{width:size, height:size}} className="relative">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,.08)" strokeWidth={stroke} fill="none"/>
        <motion.circle
          cx={size/2} cy={size/2} r={r} strokeWidth={stroke} fill="none"
          stroke="url(#g)" strokeDasharray={c} strokeDashoffset={dash}
          transition={{ type:"spring", stiffness:120, damping:20 }}
        />
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#22d3ee"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        <div>
          <div className="text-lg font-semibold">{label}</div>
          <div className="text-xs text-muted">{Math.round(progress*100)}%</div>
        </div>
      </div>
    </div>
  );
}