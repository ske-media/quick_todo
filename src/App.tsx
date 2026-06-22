import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useStore } from "./store/useStore";
import { Toast } from "./components/ui";
import { MissionsPage } from "./components/MissionsPage";
import { MissionPage } from "./components/MissionPage";
import { FocusPage } from "./components/FocusPage";
import { LogsPage } from "./components/LogsPage";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function App() {
  const view = useStore((s) => s.view);
  const toast = useStore((s) => s.toast);
  const setToast = useStore((s) => s.setToast);

  // Auto-dismiss the success toast.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast, setToast]);

  const isFocus = view === "focus";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {isFocus ? (
        // Focus mode owns the whole viewport (ultra clean).
        <FocusPage />
      ) : (
        <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:pt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {view === "missions" && <MissionsPage />}
              {view === "mission" && <MissionPage />}
              {view === "logs" && <LogsPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
