import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/* ----------------------------- Button ----------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-orange-500 text-zinc-950 hover:bg-orange-400 active:bg-orange-600 font-semibold glow-orange",
  secondary:
    "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-700 border border-zinc-700",
  ghost: "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60",
  danger:
    "bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/30",
  success:
    "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 active:bg-emerald-600 font-semibold",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-6 py-3.5 rounded-2xl gap-2.5",
};

export function Button({
  variant = "secondary",
  size = "md",
  full = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center transition-colors duration-150 select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
        "disabled:opacity-40 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        full ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

/* ----------------------------- IconButton ----------------------------- */

export function IconButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={[
        "inline-flex h-10 w-10 items-center justify-center rounded-xl",
        "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
        "disabled:opacity-30 disabled:pointer-events-none",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

/* ----------------------------- Card ----------------------------- */

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={[
        "rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/30",
        onClick ? "cursor-pointer hover:border-zinc-700 transition-colors" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ----------------------------- Modal ----------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  dismissable?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={dismissable ? onClose : undefined}
          />
          <motion.div
            className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/50"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            {(title || dismissable) && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
                {dismissable && (
                  <IconButton onClick={onClose} aria-label="Fermer">
                    <X size={20} />
                  </IconButton>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------- Toast ----------------------------- */

export function Toast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <button
            onClick={onDismiss}
            className="pointer-events-auto rounded-full border border-orange-500/40 bg-zinc-900/95 px-5 py-3 text-sm font-medium text-orange-300 shadow-xl shadow-black/40 backdrop-blur"
          >
            {message}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
