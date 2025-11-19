"use client";
import { Compass } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import WalletButton from "@/components/WalletButton";

const Nav = ({href, label}:{href:string; label:string})=>(
  <Link href={href} className="text-muted hover:text-text px-2 py-2 rounded-lg hover:bg-white/5 transition">
    {label}
  </Link>
);

export default function AppHeader(){
  return (
    <header className="sticky top-0 z-20 backdrop-blur-md border-b border-border bg-bg/70">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        {/* 좌측: 로고/타이틀 */}
        <motion.div initial={{opacity:0, y:-6}} animate={{opacity:1, y:0}} transition={{duration:.35}}
          className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-primary to-primary-600 flex items-center justify-center shadow-glow">
            <Compass className="w-5 h-5 text-white"/>
          </div>
          <div className="font-display text-lg">Expedition</div>
          <span className="badge">portfolio</span>
        </motion.div>

        {/* 우측: 내비 + 지갑 버튼 */}
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-1 mr-2">
            <Nav href="/" label="Dashboard"/>
            {/* <Nav href="/attendance" label="Attendance"/> */}
            {/* <Nav href="/fragments" label="Fragments"/> */}
            <Nav href="/craft" label="Craft"/>
            <Nav href="/expedition" label="Expedition"/>
            <Nav href="/upgrade" label="Upgrade"/>
            <Nav href="/admin" label="Admin"/>
          </nav>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}