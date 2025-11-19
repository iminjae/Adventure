"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Card({ children, className="" }: any){
  return (
    <motion.div
      className={cn("card p-4", className)}
      whileHover={{ y:-2, boxShadow:"0 10px 40px rgba(0,0,0,.35)" }}
      transition={{ type:"spring", stiffness:160, damping:20 }}
    >
      {children}
    </motion.div>
  );
}