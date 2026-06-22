import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

interface Star {
  angle: number;
  delay: number;
  distance: number;
  length: number;
  thickness: number;
}

/**
 * "Space travelling" overlay: a warp-speed starfield bursts outward, the scene
 * zooms in with motion blur, then fades to black before revealing the next task.
 */
export function SpaceTravelTransition({
  active,
  isFinal,
  onComplete,
}: {
  active: boolean;
  isFinal: boolean;
  onComplete: () => void;
}) {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 64 }, () => ({
      angle: Math.random() * 360,
      delay: Math.random() * 0.25,
      distance: 60 + Math.random() * 70, // % of viewport radius
      length: 40 + Math.random() * 160,
      thickness: 1 + Math.random() * 2.5,
    }));
  }, []);

  // Safety net: always fire completion even if an animation callback is missed.
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(onComplete, 1500);
    return () => window.clearTimeout(id);
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Warp starfield */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-0 w-0"
            initial={{ scale: 0.6 }}
            animate={{ scale: 2.4 }}
            transition={{ duration: 1.2, ease: [0.5, 0, 0.75, 0] }}
          >
            {stars.map((s, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full bg-orange-300"
                style={{
                  width: s.thickness,
                  height: s.length,
                  transformOrigin: "center top",
                  rotate: `${s.angle}deg`,
                }}
                initial={{ opacity: 0, y: 0, scaleY: 0.2 }}
                animate={{
                  opacity: [0, 1, 0.9, 0],
                  y: [0, s.distance * 6],
                  scaleY: [0.2, 1, 3],
                }}
                transition={{
                  duration: 1.1,
                  delay: s.delay,
                  ease: "easeIn",
                }}
              />
            ))}
          </motion.div>

          {/* Central glow / zoom flash */}
          <motion.div
            className="absolute h-40 w-40 rounded-full bg-orange-500 blur-3xl"
            initial={{ scale: 0.2, opacity: 0.2 }}
            animate={{ scale: [0.2, 1.5, 12], opacity: [0.2, 0.8, 0] }}
            transition={{ duration: 1.1, ease: "easeIn" }}
          />

          {/* Final success badge */}
          {isFinal && (
            <motion.div
              className="relative z-10 flex flex-col items-center gap-4 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-2xl">
                <Check size={40} strokeWidth={3} />
              </div>
              <p className="text-xl font-bold text-zinc-50">Mission accomplie</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
