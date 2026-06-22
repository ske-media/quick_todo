import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Mission,
  MissionStatus,
  PauseReason,
  Task,
  View,
} from "../types";
import * as remote from "../lib/sync";

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

interface AppState {
  missions: Mission[];
  tasks: Task[];

  // Navigation
  view: View;
  currentMissionId: string | null;
  currentTaskId: string | null;

  // Ephemeral UI flag (not persisted-critical): success toast message
  toast: string | null;

  // True once the store has been reconciled with the remote database.
  hydrated: boolean;

  // --- Sync actions ---
  hydrate: () => Promise<void>;

  // --- Navigation actions ---
  navigate: (view: View, missionId?: string | null) => void;
  setCurrentTask: (taskId: string | null) => void;
  setToast: (message: string | null) => void;

  // --- Mission actions ---
  addMission: (title: string) => string;
  deleteMission: (missionId: string) => void;
  setMissionStatus: (missionId: string, status: MissionStatus) => void;

  // --- Task actions ---
  addTask: (missionId: string, title: string, allocatedMin: number) => void;
  updateTask: (
    taskId: string,
    patch: { title?: string; allocatedMin?: number }
  ) => void;
  deleteTask: (taskId: string) => void;
  reorderTask: (taskId: string, direction: "up" | "down") => void;
  updateTaskTime: (taskId: string, elapsedSec: number) => void;
  setTaskStatus: (taskId: string, status: Task["status"]) => void;
  addPause: (
    taskId: string,
    reason: PauseReason,
    durationSec: number
  ) => void;
  completeTask: (taskId: string) => void;

  // --- Helpers / selectors (non-reactive convenience) ---
  startMission: (missionId: string) => void;
  getOrderedTasks: (missionId: string) => Task[];
  getNextTask: (missionId: string, afterTaskId: string) => Task | null;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      missions: [],
      tasks: [],
      view: "missions",
      currentMissionId: null,
      currentTaskId: null,
      toast: null,
      hydrated: false,

      hydrate: async () => {
        const remoteData = await remote.fetchAll();
        if (!remoteData) {
          // Supabase not configured/unreachable: stay on LocalStorage only.
          set({ hydrated: true });
          return;
        }
        const local = get();
        const remoteEmpty =
          remoteData.missions.length === 0 && remoteData.tasks.length === 0;
        const localHasData =
          local.missions.length > 0 || local.tasks.length > 0;

        if (remoteEmpty && localHasData) {
          // First run with an empty DB: seed it from the local cache.
          await remote.pushAll(local.missions, local.tasks);
          set({ hydrated: true });
        } else {
          // Shared database is the source of truth.
          set({
            missions: remoteData.missions,
            tasks: remoteData.tasks,
            hydrated: true,
          });
        }
      },

      navigate: (view, missionId) =>
        set((state) => ({
          view,
          currentMissionId:
            missionId !== undefined ? missionId : state.currentMissionId,
        })),

      setCurrentTask: (taskId) => set({ currentTaskId: taskId }),

      setToast: (message) => set({ toast: message }),

      addMission: (title) => {
        const id = uid();
        const mission: Mission = {
          id,
          title: title.trim() || "Mission sans titre",
          createdAt: Date.now(),
          status: "active",
        };
        set((state) => ({ missions: [mission, ...state.missions] }));
        void remote.upsertMission(mission);
        return id;
      },

      deleteMission: (missionId) => {
        set((state) => ({
          missions: state.missions.filter((m) => m.id !== missionId),
          tasks: state.tasks.filter((t) => t.missionId !== missionId),
        }));
        void remote.deleteMission(missionId);
      },

      setMissionStatus: (missionId, status) => {
        set((state) => ({
          missions: state.missions.map((m) =>
            m.id === missionId ? { ...m, status } : m
          ),
        }));
        const mission = get().missions.find((m) => m.id === missionId);
        if (mission) void remote.upsertMission(mission);
      },

      addTask: (missionId, title, allocatedMin) => {
        const siblings = get().tasks.filter((t) => t.missionId === missionId);
        const maxOrder = siblings.reduce(
          (acc, t) => Math.max(acc, t.order),
          -1
        );
        const task: Task = {
          id: uid(),
          missionId,
          title: title.trim() || "Tâche",
          order: maxOrder + 1,
          allocatedMin: Math.max(0, Math.round(allocatedMin) || 0),
          elapsedSec: 0,
          status: "todo",
          pauses: [],
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        void remote.upsertTask(task);
      },

      updateTask: (taskId, patch) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const next = { ...t };
            if (patch.title !== undefined) {
              next.title = patch.title.trim() || t.title;
            }
            if (patch.allocatedMin !== undefined) {
              next.allocatedMin = Math.max(
                0,
                Math.round(patch.allocatedMin) || 0
              );
            }
            return next;
          }),
        }));
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) void remote.upsertTask(task);
      },

      deleteTask: (taskId) => {
        const target = get().tasks.find((t) => t.id === taskId);
        set((state) => {
          if (!target) return {};
          const remaining = state.tasks
            .filter((t) => t.id !== taskId)
            .map((t) =>
              t.missionId === target.missionId && t.order > target.order
                ? { ...t, order: t.order - 1 }
                : t
            );
          return { tasks: remaining };
        });
        if (!target) return;
        void remote.deleteTask(taskId);
        // Persist the re-numbered siblings.
        void remote.upsertTasks(
          get().tasks.filter((t) => t.missionId === target.missionId)
        );
      },

      reorderTask: (taskId, direction) => {
        set((state) => {
          const target = state.tasks.find((t) => t.id === taskId);
          if (!target) return {};
          const ordered = state.tasks
            .filter((t) => t.missionId === target.missionId)
            .sort((a, b) => a.order - b.order);
          const idx = ordered.findIndex((t) => t.id === taskId);
          const swapIdx = direction === "up" ? idx - 1 : idx + 1;
          if (swapIdx < 0 || swapIdx >= ordered.length) return {};
          const a = ordered[idx];
          const b = ordered[swapIdx];
          const tasks = state.tasks.map((t) => {
            if (t.id === a.id) return { ...t, order: b.order };
            if (t.id === b.id) return { ...t, order: a.order };
            return t;
          });
          return { tasks };
        });
        const target = get().tasks.find((t) => t.id === taskId);
        if (target) {
          void remote.upsertTasks(
            get().tasks.filter((t) => t.missionId === target.missionId)
          );
        }
      },

      updateTaskTime: (taskId, elapsedSec) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, elapsedSec } : t
          ),
        }));
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) remote.throttledUpsertTask(task);
      },

      setTaskStatus: (taskId, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status,
                  startedAt:
                    status === "running" && !t.startedAt
                      ? Date.now()
                      : t.startedAt,
                }
              : t
          ),
        }));
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) remote.flushTask(task);
      },

      addPause: (taskId, reason, durationSec) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  pauses: [
                    ...t.pauses,
                    {
                      id: uid(),
                      reason,
                      durationSec: Math.max(0, Math.round(durationSec)),
                      at: Date.now(),
                    },
                  ],
                }
              : t
          ),
        }));
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) remote.flushTask(task);
      },

      completeTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: "done", completedAt: Date.now() }
              : t
          ),
        }));
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) remote.flushTask(task);
      },

      startMission: (missionId) => {
        const ordered = get().getOrderedTasks(missionId);
        const next = ordered.find((t) => t.status !== "done");
        set({
          currentMissionId: missionId,
          currentTaskId: next ? next.id : null,
          view: next ? "focus" : "mission",
        });
        if (next) get().setTaskStatus(next.id, "running");
      },

      getOrderedTasks: (missionId) =>
        get()
          .tasks.filter((t) => t.missionId === missionId)
          .sort((a, b) => a.order - b.order),

      getNextTask: (missionId, afterTaskId) => {
        const ordered = get().getOrderedTasks(missionId);
        const idx = ordered.findIndex((t) => t.id === afterTaskId);
        for (let i = idx + 1; i < ordered.length; i++) {
          if (ordered[i].status !== "done") return ordered[i];
        }
        // fallback: any remaining non-done task before it
        const remaining = ordered.find(
          (t) => t.status !== "done" && t.id !== afterTaskId
        );
        return remaining ?? null;
      },
    }),
    {
      name: "quick-todo",
      partialize: (state) => ({
        missions: state.missions,
        tasks: state.tasks,
        // Keep navigation context so "Arrêt et reprise plus tard" survives reload
        currentMissionId: state.currentMissionId,
        currentTaskId: state.currentTaskId,
      }),
    }
  )
);
