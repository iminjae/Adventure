"use client";
import { motion, AnimatePresence } from "framer-motion";


export default function SuccessModal({
  open, title="합성 성공!", subtitle, onClose
}: { open: boolean; title?: string; subtitle?: string; onClose: ()=>void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[50] bg-black/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center"
            initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: .95, opacity: 0 }}
          >
            <div className="card p-6 w-[360px] text-center">
              <div className="text-2xl font-display">{title}</div>
              {subtitle && <div className="text-sm text-muted mt-1">{subtitle}</div>}
              <button className="btn btn-primary mt-4 w-full" onClick={onClose}>확인</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}