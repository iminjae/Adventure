"use client";
export default function Spinner({ className="" }: { className?: string }) {
  return (
    <span className={`inline-block animate-spin rounded-full border-2 border-white/30 border-t-white/90 w-4 h-4 ${className}`} />
  );
}