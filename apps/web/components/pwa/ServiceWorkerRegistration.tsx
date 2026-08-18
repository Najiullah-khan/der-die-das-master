"use client";

import { useEffect } from "react";

/** Renders nothing — registers the offline-play service worker (blueprint §9) once on mount. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failing (unsupported browser, disabled in settings, etc.) just means no
      // offline support this session — the app still works fully online.
    });
  }, []);

  return null;
}
