import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "gold" | "ghost" | "danger";
}

export function Button({ children, variant = "ghost", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "gold" && "bg-gradient-to-r from-[#FFE18A] to-castDeepGold text-black shadow-gold",
        variant === "ghost" && "border border-white/10 bg-white/[0.04] text-white hover:border-castGold/30",
        variant === "danger" && "border border-red-400/25 bg-red-500/10 text-red-200 hover:border-red-400/45",
        className,
      )}
    >
      {children}
    </button>
  );
}
