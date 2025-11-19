"use client";
import Spinner from "@/components/ui/Spinner";

export default function Button({
  children, className="", loading=false, disabled, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`btn ${className} ${loading ? "opacity-80 pointer-events-none" : ""}`}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}