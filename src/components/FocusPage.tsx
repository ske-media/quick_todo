import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Maximize,
  Minimize,
  Pause,
  X,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { useTimer } from "../hooks/useTimer";
import { useFullscreen } from "../hooks/useFullscreen";
import { playAlarm, unlockAudio } from "../lib/audio";
import { formatDuration } from "../lib/format";
import { IconButton } from "./ui";
import { GrainGradient } from "./GrainGradient";
import { MusicPlayer } from "./MusicPlayer";
import { PauseModal } from "./PauseModal";
import { SpaceTravelTransition } from "./SpaceTravelTransition";
import type { Mission, PauseReason, Task } from "../types";

export function FocusPage() {
  const missionId = useStore((s) => s.currentMissionId);
  const taskId = useStore((s) => s.currentTaskId);
  const mission = useStore((s) => s.missions.find((m) => m.id === missionId));
  const task = useStore((s) => s.tasks.find((t) => t.id === taskId));

  const updateTaskTime = useStore((s) => s.updateTaskTime);
  const completeTask = useStore((s) => s.completeTask);
  const setTaskStatus = useStore((s) => s.setTaskStatus);
  const setCurrentTask = useStore((s) => s.setCurrentTask);
  const setMissionStatus = useStore((s) => s.setMissionStatus);
  const navigate = useStore((s) => s.navigate);
  const setToast = useStore((s) => s.setToast);
  const getNextTask = useStore((s) => s.getNextTask);

  const { isFullscreen, toggle, exit } = useFullscreen();
  const containerRef = useRef<HTMLDivElement>(null);

  const [transition, setTransition] = useState<{
    active: boolean;
    isFinal: boolean;
  }>({ active: false, isFinal: false });
  const nextTaskRef = useRef<Task | null>(null);

  // Guard: no active task -> bail back home.
  useEffect(() => {
    if (!mission || !task) {
      navigate("missions");
    }
  }, [mission, task, navigate]);

  if (!mission || !task) return null;

  const handleValidated = (finalElapsedSec: number) => {
    updateTaskTime(task.id, finalElapsedSec);
    completeTask(task.id);
    const next = getNextTask(mission.id, task.id);
    nextTaskRef.current = next;
    setTransition({ active: true, isFinal: !next });
  };

  const handleTransitionComplete = () => {
    const next = nextTaskRef.current;
    if (next) {
      setCurrentTask(next.id);
      setTaskStatus(next.id, "running");
      setTransition({ active: false, isFinal: false });
    } else {
      setMissionStatus(mission.id, "done");
      void exit();
      setToast("Mission accomplie — bravo !");
      navigate("missions");
      setTransition({ active: false, isFinal: false });
    }
    nextTaskRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen flex-col bg-zinc-950"
    >
      <GrainGradient variant="bold" />

      <SpaceTravelTransition
        active={transition.active}
        isFinal={transition.isFinal}
        onComplete={handleTransitionComplete}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <button
          onClick={() => {
            void exit();
            navigate("mission", mission.id);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <X size={14} />
          Quitter
        </button>
        <p className="max-w-[55%] truncate text-center text-xs font-medium uppercase tracking-widest text-zinc-500">
          {mission.title}
        </p>
        <IconButton
          aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          onClick={() => toggle(containerRef.current)}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </IconButton>
      </div>

      {/* The actual focus body is keyed by task id so its timer fully resets. */}
      <div className="relative z-10 flex flex-1 flex-col">
        <FocusTask
          key={task.id}
          task={task}
          mission={mission}
          paused={transition.active}
          onValidate={handleValidated}
          onStopLater={(elapsed) => {
            updateTaskTime(task.id, elapsed);
            setTaskStatus(task.id, "paused");
            void exit();
            navigate("missions");
          }}
          onPauseRecorded={(reason: PauseReason, durationSec: number) => {
            useStore.getState().addPause(task.id, reason, durationSec);
          }}
        />
      </div>

      {/* Ambient focus music — stays mounted across task transitions so the
          stream keeps playing fluidly between tasks. */}
      <MusicPlayer />
    </div>
  );
}

/* ----------------------- Focused single task ----------------------- */

function FocusTask({
  task,
  mission: _mission,
  paused,
  onValidate,
  onStopLater,
  onPauseRecorded,
}: {
  task: Task;
  mission: Mission;
  paused: boolean; // true while a transition overlay is playing
  onValidate: (finalElapsedSec: number) => void;
  onStopLater: (finalElapsedSec: number) => void;
  onPauseRecorded: (reason: PauseReason, durationSec: number) => void;
}) {
  const updateTaskTime = useStore((s) => s.updateTaskTime);

  const allocatedSec = task.allocatedMin * 60;
  const [pauseOpen, setPauseOpen] = useState(false);

  const running = !pauseOpen && !paused;

  const { elapsedSec } = useTimer({
    running,
    initialElapsedSec: task.elapsedSec,
    allocatedSec,
    onTick: (secs) => updateTaskTime(task.id, secs),
    onOverrun: () => playAlarm(),
  });

  const remaining = allocatedSec - elapsedSec;
  const isOver = allocatedSec === 0 || remaining <= 0;
  const overtime = Math.max(0, elapsedSec - allocatedSec);

  // Progress for the ring (countdown fraction, full when overrun).
  const progress = isOver
    ? 1
    : allocatedSec > 0
    ? Math.min(1, elapsedSec / allocatedSec)
    : 1;

  const R = 130;
  const C = 2 * Math.PI * R;
  const accent = isOver ? "#ef4444" : "#f97316";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-32 pt-6">
      {/* Task name */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 max-w-2xl text-center text-3xl font-extrabold leading-tight tracking-tight text-zinc-50 sm:text-4xl"
      >
        {task.title}
      </motion.h1>

      {/* Timer ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="relative flex items-center justify-center"
      >
        <svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          className="-rotate-90"
        >
          <circle
            cx="150"
            cy="150"
            r={R}
            fill="none"
            stroke="#27272a"
            strokeWidth="10"
          />
          <motion.circle
            cx="150"
            cy="150"
            r={R}
            fill="none"
            stroke={accent}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - progress) }}
            transition={{ ease: "linear", duration: 0.3 }}
            style={{ filter: `drop-shadow(0 0 10px ${accent}aa)` }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-xs font-medium uppercase tracking-[0.2em] ${
              isOver ? "text-red-400" : "text-zinc-500"
            }`}
            animate={isOver ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
            transition={
              isOver ? { repeat: Infinity, duration: 1.4 } : { duration: 0 }
            }
          >
            {isOver ? "Dépassement" : "Restant"}
          </motion.span>
          <span
            className={`font-mono text-6xl font-bold tabular-nums ${
              isOver ? "text-red-400" : "text-zinc-50"
            }`}
          >
            {isOver
              ? `+${formatDuration(overtime)}`
              : formatDuration(remaining)}
          </span>
          <span className="mt-1 text-xs text-zinc-600">
            {task.allocatedMin} min alloué · {formatDuration(elapsedSec)} total
          </span>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="mt-12 flex w-full max-w-sm items-center gap-3">
        <button
          onClick={() => {
            unlockAudio();
            setPauseOpen(true);
          }}
          className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
        >
          <Pause size={22} />
          Pause
        </button>
        <button
          onClick={() => {
            unlockAudio();
            onValidate(elapsedSec);
          }}
          className="flex h-16 flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-emerald-500 font-bold text-zinc-950 transition-colors hover:bg-emerald-400 active:bg-emerald-600"
        >
          <Check size={24} strokeWidth={3} />
          Valider la tâche
        </button>
      </div>

      <PauseModal
        open={pauseOpen}
        onResume={(reason, durationSec) => {
          onPauseRecorded(reason, durationSec);
          setPauseOpen(false);
        }}
        onStopLater={() => {
          setPauseOpen(false);
          onStopLater(elapsedSec);
        }}
      />
    </div>
  );
}
