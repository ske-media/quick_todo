import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Folder,
  ListChecks,
  Plus,
  Rocket,
  Trash2,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { Button, Card, IconButton, Modal } from "./ui";
import { formatDateShort, formatHuman } from "../lib/format";

export function MissionsPage() {
  const missions = useStore((s) => s.missions);
  const tasks = useStore((s) => s.tasks);
  const addMission = useStore((s) => s.addMission);
  const deleteMission = useStore((s) => s.deleteMission);
  const navigate = useStore((s) => s.navigate);

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  const statsByMission = useMemo(() => {
    const map = new Map<
      string,
      { total: number; done: number; allocatedSec: number; elapsedSec: number }
    >();
    for (const t of tasks) {
      const s =
        map.get(t.missionId) ??
        { total: 0, done: 0, allocatedSec: 0, elapsedSec: 0 };
      s.total += 1;
      if (t.status === "done") s.done += 1;
      s.allocatedSec += t.allocatedMin * 60;
      s.elapsedSec += t.elapsedSec;
      map.set(t.missionId, s);
    }
    return map;
  }, [tasks]);

  const submit = () => {
    const id = addMission(title);
    setTitle("");
    setCreating(false);
    navigate("mission", id);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-50">
            Missions
          </h1>
          <p className="text-sm text-zinc-500">
            Organisez votre travail, lancez le focus.
          </p>
        </div>
        <IconButton
          aria-label="Voir les logs"
          onClick={() => navigate("logs")}
          className="border border-zinc-800"
        >
          <ClipboardList size={20} />
        </IconButton>
      </header>

      <Button variant="primary" size="lg" full onClick={() => setCreating(true)}>
        <Plus size={20} />
        Nouvelle mission
      </Button>

      {missions.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/70 text-orange-500">
            <Rocket size={26} />
          </div>
          <p className="text-zinc-300">Aucune mission pour l'instant</p>
          <p className="max-w-xs text-sm text-zinc-500">
            Créez votre première mission pour commencer à suivre votre temps.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {missions.map((m) => {
            const s = statsByMission.get(m.id) ?? {
              total: 0,
              done: 0,
              allocatedSec: 0,
              elapsedSec: 0,
            };
            const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
            const complete = s.total > 0 && s.done === s.total;
            return (
              <Card
                key={m.id}
                onClick={() => navigate("mission", m.id)}
                className="group p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      complete
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-orange-500/15 text-orange-500"
                    }`}
                  >
                    {complete ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Folder size={20} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold text-zinc-100">
                        {m.title}
                      </h3>
                      <IconButton
                        aria-label="Supprimer la mission"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Supprimer la mission « ${m.title} » et ses tâches ?`
                            )
                          ) {
                            deleteMission(m.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span>{formatDateShort(m.createdAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        <ListChecks size={13} />
                        {s.done}/{s.total} tâches
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} />
                        {formatHuman(s.allocatedSec)}
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          complete ? "bg-emerald-500" : "bg-orange-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nouvelle mission"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">
              Titre de la mission
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ex : Refonte du site web"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              full
              onClick={() => setCreating(false)}
            >
              Annuler
            </Button>
            <Button variant="primary" full onClick={submit}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
