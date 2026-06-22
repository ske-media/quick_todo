import { useEffect, useRef, useState } from "react";
import { Cigarette, Coffee, DoorOpen, Droplets, Play } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Modal } from "./ui";
import { formatDuration } from "../lib/format";
import type { PauseReason } from "../types";

const REASONS: { reason: PauseReason; icon: typeof Coffee; hint: string }[] = [
  { reason: "Pause clope", icon: Cigarette, hint: "Petite clope" },
  { reason: "Pause pipi", icon: Droplets, hint: "Pause technique" },
  { reason: "Pause souhaitée", icon: Coffee, hint: "Respiration / café" },
];

export function PauseModal({
  open,
  onResume,
  onStopLater,
}: {
  open: boolean;
  /** Called when the user resumes after a timed pause. */
  onResume: (reason: PauseReason, durationSec: number) => void;
  /** "Arrêt et reprise plus tard" — saves state and returns home. */
  onStopLater: () => void;
}) {
  const [reason, setReason] = useState<PauseReason | null>(null);
  const [pauseSec, setPauseSec] = useState(0);
  const startRef = useRef<number>(0);

  // Reset internal state whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setReason(null);
      setPauseSec(0);
    }
  }, [open]);

  // Count the pause duration once a reason is picked.
  useEffect(() => {
    if (!open || !reason) return;
    startRef.current = Date.now();
    setPauseSec(0);
    const id = window.setInterval(() => {
      setPauseSec(Math.floor((Date.now() - startRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [open, reason]);

  const handleResume = () => {
    if (!reason) return;
    const duration = Math.floor((Date.now() - startRef.current) / 1000);
    onResume(reason, duration);
  };

  return (
    <Modal open={open} onClose={() => {}} dismissable={false}>
      <AnimatePresence mode="wait">
        {reason === null ? (
          <motion.div
            key="choices"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="text-center">
              <h2 className="text-lg font-semibold text-zinc-100">
                Pause en cours
              </h2>
              <p className="text-sm text-zinc-500">
                Choisissez un motif (obligatoire)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {REASONS.map(({ reason: r, icon: Icon, hint }) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-left transition-colors hover:border-orange-500/60 hover:bg-zinc-800/60"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500">
                    <Icon size={22} />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-zinc-100">{r}</span>
                    <span className="block text-xs text-zinc-500">{hint}</span>
                  </span>
                </button>
              ))}

              <button
                onClick={onStopLater}
                className="mt-1 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-transparent p-4 text-left transition-colors hover:border-red-500/40 hover:bg-red-500/5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                  <DoorOpen size={22} />
                </span>
                <span className="flex-1">
                  <span className="block font-medium text-zinc-200">
                    Arrêt et reprise plus tard
                  </span>
                  <span className="block text-xs text-zinc-500">
                    Sauvegarde l'état et retourne à l'accueil
                  </span>
                </span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="running"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5 py-2 text-center"
          >
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-400">
              {reason}
            </span>
            <div className="font-mono text-6xl font-bold tabular-nums text-zinc-100">
              {formatDuration(pauseSec)}
            </div>
            <p className="text-sm text-zinc-500">
              Le chrono de la tâche est suspendu.
            </p>
            <button
              onClick={handleResume}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 font-semibold text-zinc-950 transition-colors hover:bg-orange-400 glow-orange"
            >
              <Play size={20} />
              Reprendre la tâche
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
