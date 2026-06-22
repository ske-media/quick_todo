import { supabase } from "./supabase";
import type { Mission, PauseEntry, Task, TaskStatus } from "../types";

/* ------------------------- Row <-> model mapping ------------------------- */

interface MissionRow {
  id: string;
  title: string;
  created_at: number;
  status: Mission["status"];
}

interface TaskRow {
  id: string;
  mission_id: string;
  title: string;
  order: number;
  allocated_min: number;
  elapsed_sec: number;
  status: TaskStatus;
  pauses: PauseEntry[];
  started_at: number | null;
  completed_at: number | null;
}

function missionToRow(m: Mission): MissionRow {
  return {
    id: m.id,
    title: m.title,
    created_at: m.createdAt,
    status: m.status,
  };
}

function rowToMission(r: MissionRow): Mission {
  return {
    id: r.id,
    title: r.title,
    createdAt: Number(r.created_at),
    status: r.status,
  };
}

function taskToRow(t: Task): TaskRow {
  return {
    id: t.id,
    mission_id: t.missionId,
    title: t.title,
    order: t.order,
    allocated_min: t.allocatedMin,
    elapsed_sec: t.elapsedSec,
    status: t.status,
    pauses: t.pauses ?? [],
    started_at: t.startedAt ?? null,
    completed_at: t.completedAt ?? null,
  };
}

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    missionId: r.mission_id,
    title: r.title,
    order: r.order,
    allocatedMin: r.allocated_min,
    elapsedSec: r.elapsed_sec,
    status: r.status,
    pauses: Array.isArray(r.pauses) ? r.pauses : [],
    startedAt: r.started_at ?? undefined,
    completedAt: r.completed_at ?? undefined,
  };
}

/* ------------------------------- Reads ------------------------------- */

export async function fetchAll(): Promise<{
  missions: Mission[];
  tasks: Task[];
} | null> {
  if (!supabase) return null;
  const [missionsRes, tasksRes] = await Promise.all([
    supabase.from("missions").select("*"),
    supabase.from("tasks").select("*"),
  ]);
  if (missionsRes.error || tasksRes.error) {
    console.warn(
      "[sync] fetchAll failed:",
      missionsRes.error || tasksRes.error
    );
    return null;
  }
  return {
    missions: (missionsRes.data as MissionRow[]).map(rowToMission),
    tasks: (tasksRes.data as TaskRow[]).map(rowToTask),
  };
}

/* ------------------------------- Writes ------------------------------ */
/* All writes are best-effort: failures are logged but never block the UI. */

export async function upsertMission(m: Mission): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("missions").upsert(missionToRow(m));
  if (error) console.warn("[sync] upsertMission failed:", error);
}

export async function deleteMission(id: string): Promise<void> {
  if (!supabase) return;
  // Tasks are removed via ON DELETE CASCADE on the FK.
  const { error } = await supabase.from("missions").delete().eq("id", id);
  if (error) console.warn("[sync] deleteMission failed:", error);
}

export async function upsertTask(t: Task): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("tasks").upsert(taskToRow(t));
  if (error) console.warn("[sync] upsertTask failed:", error);
}

export async function deleteTask(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) console.warn("[sync] deleteTask failed:", error);
}

export async function upsertTasks(tasks: Task[]): Promise<void> {
  if (!supabase || tasks.length === 0) return;
  const { error } = await supabase.from("tasks").upsert(tasks.map(taskToRow));
  if (error) console.warn("[sync] upsertTasks failed:", error);
}

export async function pushAll(
  missions: Mission[],
  tasks: Task[]
): Promise<void> {
  if (!supabase) return;
  if (missions.length) {
    const { error } = await supabase
      .from("missions")
      .upsert(missions.map(missionToRow));
    if (error) {
      console.warn("[sync] pushAll missions failed:", error);
      return;
    }
  }
  await upsertTasks(tasks);
}

/* --------------------- Throttled time persistence -------------------- */
/*
 * The focus timer updates elapsed every second. We avoid hammering the DB by
 * throttling remote writes per task (trailing flush), while keeping the local
 * store (and LocalStorage) perfectly up to date every second.
 */

const FLUSH_INTERVAL_MS = 10_000;
const pendingTimers = new Map<string, number>();
const latestTask = new Map<string, Task>();

export function throttledUpsertTask(task: Task): void {
  if (!supabase) return;
  latestTask.set(task.id, task);
  if (pendingTimers.has(task.id)) return;

  const id = window.setTimeout(() => {
    pendingTimers.delete(task.id);
    const t = latestTask.get(task.id);
    latestTask.delete(task.id);
    if (t) void upsertTask(t);
  }, FLUSH_INTERVAL_MS);

  pendingTimers.set(task.id, id);
}

/** Immediately flush any pending throttled write for a task. */
export function flushTask(task: Task): void {
  if (!supabase) return;
  const timer = pendingTimers.get(task.id);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    pendingTimers.delete(task.id);
  }
  latestTask.delete(task.id);
  void upsertTask(task);
}
