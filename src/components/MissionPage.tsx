import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ListChecks,
  Pause,
  Pencil,
  Play,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { Button, Card, IconButton, Modal } from "./ui";
import { formatHuman } from "../lib/format";
import type { Task, TaskStatus } from "../types";

const statusMeta: Record<
  TaskStatus,
  { label: string; className: string; icon: typeof Check }
> = {
  todo: { label: "À faire", className: "text-zinc-500", icon: Timer },
  running: { label: "En cours", className: "text-orange-400", icon: Play },
  paused: { label: "En pause", className: "text-amber-400", icon: Pause },
  done: { label: "Terminé", className: "text-emerald-400", icon: Check },
};

export function MissionPage() {
  const missionId = useStore((s) => s.currentMissionId);
  const mission = useStore((s) =>
    s.missions.find((m) => m.id === missionId)
  );
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const reorderTask = useStore((s) => s.reorderTask);
  const navigate = useStore((s) => s.navigate);
  const startMission = useStore((s) => s.startMission);

  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("25");

  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMinutes, setEditMinutes] = useState("");

  const openEdit = (task: Task) => {
    setEditId(task.id);
    setEditTitle(task.title);
    setEditMinutes(String(task.allocatedMin));
  };

  const submitEdit = () => {
    if (!editId) return;
    updateTask(editId, {
      title: editTitle,
      allocatedMin: parseInt(editMinutes, 10) || 0,
    });
    setEditId(null);
  };

  const ordered = useMemo<Task[]>(
    () =>
      tasks
        .filter((t) => t.missionId === missionId)
        .sort((a, b) => a.order - b.order),
    [tasks, missionId]
  );

  if (!mission) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-zinc-400">Mission introuvable.</p>
        <Button onClick={() => navigate("missions")}>Retour à l'accueil</Button>
      </div>
    );
  }

  const totalAllocated = ordered.reduce(
    (acc, t) => acc + t.allocatedMin * 60,
    0
  );
  const doneCount = ordered.filter((t) => t.status === "done").length;
  const allDone = ordered.length > 0 && doneCount === ordered.length;

  const submitTask = () => {
    if (!title.trim()) return;
    addTask(missionId!, title, parseInt(minutes, 10) || 0);
    setTitle("");
    setMinutes("25");
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start gap-3">
        <IconButton
          aria-label="Retour"
          onClick={() => navigate("missions")}
          className="mt-1 border border-zinc-800"
        >
          <ArrowLeft size={20} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-zinc-50">
            {mission.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <ListChecks size={13} />
              {doneCount}/{ordered.length} tâches
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={13} />
              {formatHuman(totalAllocated)} alloué
            </span>
          </div>
        </div>
      </header>

      {/* Add task */}
      <Card className="p-4">
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Ajouter une tâche
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTask()}
            placeholder="Intitulé de la tâche"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="number"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitTask()}
                className="w-28 rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-4 pr-10 text-zinc-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                min
              </span>
            </div>
            <Button variant="primary" onClick={submitTask} aria-label="Ajouter">
              <Plus size={20} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Task list */}
      {ordered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Aucune tâche. Ajoutez-en pour définir l'ordre d'exécution.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {ordered.map((t, idx) => {
            const meta = statusMeta[t.status];
            const StatusIcon = meta.icon;
            return (
              <li key={t.id}>
                <Card className="flex items-center gap-3 p-3">
                  <div className="flex flex-col">
                    <IconButton
                      aria-label="Monter"
                      className="h-6 w-6"
                      disabled={idx === 0}
                      onClick={() => reorderTask(t.id, "up")}
                    >
                      <ChevronUp size={16} />
                    </IconButton>
                    <IconButton
                      aria-label="Descendre"
                      className="h-6 w-6"
                      disabled={idx === ordered.length - 1}
                      onClick={() => reorderTask(t.id, "down")}
                    >
                      <ChevronDown size={16} />
                    </IconButton>
                  </div>

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-400">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-medium ${
                        t.status === "done"
                          ? "text-zinc-500 line-through"
                          : "text-zinc-100"
                      }`}
                    >
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 ${meta.className}`}
                      >
                        <StatusIcon size={12} />
                        {meta.label}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="inline-flex items-center gap-1 text-zinc-500">
                        <Clock size={12} />
                        {t.allocatedMin} min
                      </span>
                      {t.elapsedSec > 0 && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className="text-zinc-500">
                            {formatHuman(t.elapsedSec)} réel
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <IconButton
                    aria-label="Modifier la tâche"
                    className="h-8 w-8"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton
                    aria-label="Supprimer la tâche"
                    className="h-8 w-8"
                    onClick={() => deleteTask(t.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      {/* Launch */}
      <div className="sticky bottom-4 mt-2">
        <Button
          variant={allDone ? "success" : "primary"}
          size="lg"
          full
          disabled={ordered.length === 0 || allDone}
          onClick={() => startMission(missionId!)}
        >
          <Play size={20} />
          {allDone
            ? "Mission terminée"
            : doneCount > 0
            ? "Reprendre la mission"
            : "Lancer la mission"}
        </Button>
      </div>

      <Modal
        open={editId !== null}
        onClose={() => setEditId(null)}
        title="Modifier la tâche"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">
              Intitulé de la tâche
            </label>
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitEdit()}
              placeholder="Intitulé de la tâche"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">
              Temps alloué (minutes)
            </label>
            <input
              type="number"
              min={0}
              value={editMinutes}
              onChange={(e) => setEditMinutes(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitEdit()}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" full onClick={() => setEditId(null)}>
              Annuler
            </Button>
            <Button variant="primary" full onClick={submitEdit}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
