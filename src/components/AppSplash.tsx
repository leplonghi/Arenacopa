import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandWordmark } from "@/components/BrandWordmark";
import { BRAND_MARK_SRC } from "@/lib/brand-assets";
import { getArenaAssetSrc } from "@/lib/arena-assets";

const SPLASH_SESSION_KEY = "arenacopa_cinematic_splash_seen";
const SPLASH_DURATION_MS = 2200;
const REDUCED_MOTION_DURATION_MS = 500;

function shouldReduceMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function useSplashVisibility() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SPLASH_SESSION_KEY) !== "true";
  });

  useEffect(() => {
    if (!visible) return;

    const duration = shouldReduceMotion() ? REDUCED_MOTION_DURATION_MS : SPLASH_DURATION_MS;
    const timeout = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
      setVisible(false);
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [visible]);

  return visible;
}

export function AppSplash() {
  const visible = useSplashVisibility();
  const heroBgSrc = getArenaAssetSrc("fundo-hero.png");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#010604] text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: "easeInOut" }}
          aria-label="ArenaCopa"
          role="status"
        >
          {heroBgSrc ? (
            <motion.div
              className="absolute inset-0 bg-cover bg-[70%_center]"
              style={{ backgroundImage: `url(${heroBgSrc})` }}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,7,5,0.98)_0%,rgba(1,7,5,0.82)_48%,rgba(1,7,5,0.28)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.08)_42%,rgba(0,0,0,0.74)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[#FFC212]/60 shadow-[0_0_24px_rgba(255,194,18,0.55)]" />

          <div className="relative z-10 flex min-h-[420px] w-full max-w-[460px] flex-col items-center justify-center px-8 text-center">
            <motion.div
              className="relative mb-5 grid h-24 w-24 place-items-center sm:h-28 sm:w-28"
              initial={{ scale: 0.84, opacity: 0, filter: "blur(8px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.18, duration: 0.62, ease: "backOut" }}
            >
              <motion.div
                className="absolute inset-[-10px] rounded-full border border-[#FFC212]/30"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.05, opacity: 1 }}
                transition={{ delay: 0.34, duration: 0.62, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-[#FFC212]/16 blur-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.85, scale: 1.18 }}
                transition={{ delay: 0.42, duration: 0.62, ease: "easeOut" }}
              />
              <img
                src={BRAND_MARK_SRC}
                alt=""
                className="relative h-full w-full object-contain drop-shadow-[0_0_28px_rgba(255,194,18,0.45)]"
                draggable={false}
              />
            </motion.div>

            <motion.div
              className="mb-3 inline-flex items-center gap-2 border border-white/12 bg-black/25 px-3 py-1 text-xs font-extrabold text-[#DFFFD7] backdrop-blur-md"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.58, duration: 0.38, ease: "easeOut" }}
            >
              <span className="h-2 w-2 rounded-full bg-[#7EFF48] shadow-[0_0_12px_rgba(126,255,72,0.8)]" />
              Bolão em campo
            </motion.div>
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.72, duration: 0.5, ease: "circOut" }}
            >
              <BrandWordmark
                label="ArenaCUP"
                className="font-display text-[4.25rem] font-black leading-[0.82] text-white drop-shadow-[0_0_24px_rgba(255,194,18,0.2)] sm:text-[5.4rem]"
              />
            </motion.div>
            <motion.p
              className="mt-4 max-w-[320px] text-sm font-bold leading-5 text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.72)]"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.92, duration: 0.4, ease: "easeOut" }}
            >
              Palpites, ranking e rodada no mesmo gramado.
            </motion.p>
            <motion.div
              className="mt-7 h-1 w-40 overflow-hidden bg-white/12"
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 1.06, duration: 0.3, ease: "easeOut" }}
            >
              <motion.div
                className="h-full bg-[linear-gradient(90deg,#7EFF48,#FFC212,#FF9800)]"
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ delay: 1.14, duration: 0.72, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
