"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function ErrorModal({ open, title="실패", message, onClose }:{
  open: boolean; title?: string; message?: string; onClose: ()=>void;
}){
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[50] bg-black/50"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
          <motion.div className="fixed inset-0 z-[61] flex items-center justify-center"
            initial={{scale:.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:.95, opacity:0}}>
            <div className="card p-6 w-[360px] text-center">
              <div className="text-2xl font-display">{title}</div>
              {message && <div className="text-sm text-muted mt-1 whitespace-pre-wrap">{message}</div>}
              <button className="btn mt-4 w-full" onClick={onClose}>닫기</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}