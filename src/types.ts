export type MissionStatus = "active" | "done";

export type TaskStatus = "todo" | "running" | "paused" | "done";

export type PauseReason =
  | "Pause clope"
  | "Pause pipi"
  | "Pause souhaitée";

export interface PauseEntry {
  id: string;
  reason: PauseReason;
  durationSec: number;
  at: number; // timestamp (ms) when the pause ended
}

export interface Mission {
  id: string;
  title: string;
  createdAt: number;
  status: MissionStatus;
}

export interface Task {
  id: string;
  missionId: string;
  title: string;
  order: number;
  allocatedMin: number; // temps alloué en minutes
  elapsedSec: number; // temps réel passé en secondes (inclut le dépassement)
  status: TaskStatus;
  pauses: PauseEntry[];
  startedAt?: number; // première mise en route
  completedAt?: number; // date de réalisation
}

export type View = "missions" | "mission" | "focus" | "logs";
