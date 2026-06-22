import { useCallback, useEffect, useState } from "react";

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

/** Cross-browser wrapper around the Fullscreen API. */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const doc = document as FullscreenDocument;
    const handler = () => {
      setIsFullscreen(
        Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)
      );
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  const enter = useCallback(async (target?: HTMLElement | null) => {
    const el = (target ?? document.documentElement) as FullscreenElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      /* fullscreen may be blocked; fail silently */
    }
  }, []);

  const exit = useCallback(async () => {
    const doc = document as FullscreenDocument;
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    async (target?: HTMLElement | null) => {
      if (isFullscreen) await exit();
      else await enter(target);
    },
    [isFullscreen, enter, exit]
  );

  return { isFullscreen, enter, exit, toggle };
}
