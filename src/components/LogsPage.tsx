import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  Coffee,
  Folder,
  Pause,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { Card, IconButton } from "./ui";
import { formatDate, formatDateShort, formatHuman } from "../lib/format";
import type { Task } from "../types";

function TaskLogRow({ task }: { task: Task }) {
  const allocatedSec = task.allocatedMin * 60;
  const overtime = Math.max(0, task.elapsedSec - allocatedSec);
  const pauseTotal = task.pauses.reduce((acc, p) => acc + p.durationSec, 0);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <p
          className={`font-medium ${
            task.status === "done" ? "text-zinc-200" : "text-zinc-300"
          }`}
        >
          {task.title}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            task.status === "done"
              ? "bg-emerald-500/15 text-emerald-400"
              : task.status === "paused"
              ? "bg-amber-500/15 text-amber-400"
              : task.status === "running"
              ? "bg-orange-500/15 text-orange-400"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {task.status === "done"
            ? "Terminé"
            : task.status === "paused"
            ? "En pause"
            : task.status === "running"
            ? "En cours"
            : "À faire"}
        </span>
      </div>

      {task.completedAt && (
        <p className="mt-0.5 text-xs text-zinc-600">
          Réalisé le {formatDate(task.completedAt)}
        </p>
      )}

      {/* Allocated vs real */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-zinc-900 px-2 py-2">
          <div className="flex items-center justify-center gap-1 text-zinc-500">
            <Clock size={12} /> Alloué
          </div>
          <div className="mt-0.5 font-semibold text-zinc-200">
            {formatHuman(allocatedSec)}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-900 px-2 py-2">
          <div className="flex items-center justify-center gap-1 text-zinc-500">
            <TimerReset size={12} /> Réel
          </div>
          <div className="mt-0.5 font-semibold text-zinc-200">
            {formatHuman(task.elapsedSec)}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-900 px-2 py-2">
          <div className="flex items-center justify-center gap-1 text-zinc-500">
            <TrendingUp size={12} /> Dépass.
          </div>
          <div
            className={`mt-0.5 font-semibold ${
              overtime > 0 ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {overtime > 0 ? `+${formatHuman(overtime)}` : "—"}
          </div>
        </div>
      </div>

      {/* Pauses */}
      {task.pauses.length > 0 && (
        <div className="mt-2 border-t border-zinc-800 pt-2">
          <div className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
            <Pause size={12} />
            Pauses ({formatHuman(pauseTotal)} au total)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {task.pauses.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300"
              >
                <Coffee size={11} className="text-orange-400" />
                {p.reason} · {formatHuman(p.durationSec)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LogsPage() {
  const missions = useStore((s) => s.missions);
  const tasks = useStore((s) => s.tasks);
  const navigate = useStore((s) => s.navigate);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const tasksByMission = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const arr = map.get(t.missionId) ?? [];
      arr.push(t);
      map.set(t.missionId, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <IconButton
          aria-label="Retour"
          onClick={() => navigate("missions")}
          className="border border-zinc-800"
        >
          <ArrowLeft size={20} />
        </IconButton>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-50">
            Logs &amp; Rapports
          </h1>
          <p className="text-sm text-zinc-500">
            Historique du temps alloué vs réel.
          </p>
        </div>
      </header>

      {missions.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          Aucune donnée à afficher pour l'instant.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {missions.map((m) => {
            const mTasks = tasksByMission.get(m.id) ?? [];
            const allocated = mTasks.reduce(
              (a, t) => a + t.allocatedMin * 60,
              0
            );
            const real = mTasks.reduce((a, t) => a + t.elapsedSec, 0);
            const isOpen = expanded[m.id] ?? false;
            const overtime = Math.max(0, real - allocated);

            return (
              <Card key={m.id} className="overflow-hidden">
                <button
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [m.id]: !isOpen }))
                  }
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      m.status === "done"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-orange-500/15 text-orange-500"
                    }`}
                  >
                    <Folder size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-zinc-100">
                        {m.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          m.status === "done"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-orange-500/15 text-orange-400"
                        }`}
                      >
                        {m.status === "done" ? "Terminée" : "En cours"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatDateShort(m.createdAt)} · {mTasks.length} tâches ·{" "}
                      {formatHuman(real)} / {formatHuman(allocated)}
                      {overtime > 0 && (
                        <span className="text-red-400">
                          {" "}
                          (+{formatHuman(overtime)})
                        </span>
                      )}
                    </p>
                  </div>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="text-zinc-500"
                  >
                    <ChevronDown size={20} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-2 px-4 pb-4">
                        {mTasks.length === 0 ? (
                          <p className="py-2 text-center text-sm text-zinc-600">
                            Aucune tâche.
                          </p>
                        ) : (
                          mTasks.map((t) => (
                            <TaskLogRow key={t.id} task={t} />
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
