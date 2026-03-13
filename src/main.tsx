import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const ELECTRON_RELOAD_FLAG = "__electron_reloading__";

const Bootstrap = () => {
  const [showReloadOverlay, setShowReloadOverlay] = useState(false);

  useEffect(() => {
    const isElectron = navigator.userAgent.toLowerCase().includes("electron");
    if (!isElectron) return;

    const shouldShow = sessionStorage.getItem(ELECTRON_RELOAD_FLAG) === "1";
    if (!shouldShow) return;

    sessionStorage.removeItem(ELECTRON_RELOAD_FLAG);
    setShowReloadOverlay(true);

    const timer = window.setTimeout(() => {
      setShowReloadOverlay(false);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <App />
      {showReloadOverlay ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 backdrop-blur-sm">
          <div className="rounded-xl border border-violet-200 bg-white px-5 py-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Refreshing App</p>
                <p className="text-xs text-slate-500">Reloading latest screen...</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

createRoot(document.getElementById("root")!).render(<Bootstrap />);
