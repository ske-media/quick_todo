import { useEffect, useRef, useState } from "react";

interface UseTimerOptions {
  running: boolean;
  initialElapsedSec: number;
  /** Allocated time in seconds; used to detect the overrun crossing. */
  allocatedSec: number;
  /** Fired once when elapsed first reaches/passes the allocated time. */
  onOverrun?: () => void;
  /** Fired (at most) once per whole second with the current elapsed value. */
  onTick?: (elapsedSec: number) => void;
}

/**
 * Robust elapsed-time tracker.
 *
 * Instead of naively `++` on each interval (which drifts and pauses when the
 * tab is throttled), we anchor on wall-clock timestamps: elapsed = base +
 * (now - start). The interval only exists while `running` is true and is
 * always cleared on cleanup, so there are no leaked timers.
 */
export function useTimer({
  running,
  initialElapsedSec,
  allocatedSec,
  onOverrun,
  onTick,
}: UseTimerOptions) {
  const [elapsedSec, setElapsedSec] = useState<number>(
    Math.floor(initialElapsedSec)
  );

  const baseRef = useRef<number>(Math.floor(initialElapsedSec));
  const startRef = useRef<number>(Date.now());
  const lastWholeRef = useRef<number>(Math.floor(initialElapsedSec));
  const overrunFiredRef = useRef<boolean>(
    allocatedSec > 0 && initialElapsedSec >= allocatedSec
  );

  // Keep the latest callbacks without restarting the interval.
  const onTickRef = useRef(onTick);
  const onOverrunRef = useRef(onOverrun);
  useEffect(() => {
    onTickRef.current = onTick;
    onOverrunRef.current = onOverrun;
  }, [onTick, onOverrun]);

  useEffect(() => {
    if (!running) return;

    // Anchor on the current elapsed value when (re)starting.
    baseRef.current = elapsedSec;
    startRef.current = Date.now();

    const id = window.setInterval(() => {
      const computed =
        baseRef.current + (Date.now() - startRef.current) / 1000;
      const whole = Math.floor(computed);

      if (whole !== lastWholeRef.current) {
        lastWholeRef.current = whole;
        setElapsedSec(whole);
        onTickRef.current?.(whole);

        if (
          !overrunFiredRef.current &&
          allocatedSec > 0 &&
          whole >= allocatedSec
        ) {
          overrunFiredRef.current = true;
          onOverrunRef.current?.();
        }
      }
    }, 250);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, allocatedSec]);

  return { elapsedSec, setElapsedSec };
}
