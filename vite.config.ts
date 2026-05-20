import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const projectId = env.VITE_FIREBASE_PROJECT_ID || "arenacopa-web-2026";
  const useFirebaseEmulators = env.VITE_USE_FIREBASE_EMULATORS === "true";
  const functionsRegion = env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1";
  const functionsTarget = useFirebaseEmulators
    ? `http://${env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1"}:${env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || "5001"}/${projectId}/${functionsRegion}`
    : `https://${functionsRegion}-${projectId}.cloudfunctions.net`;
  const functionsProxy = {
    target: functionsTarget,
    changeOrigin: true,
    secure: !useFirebaseEmulators,
    rewrite: (requestPath: string) => requestPath.replace(/^\/(__)?functions\/?/, ""),
  };

  return {
    server: {
      host: "localhost",
      port: 8080,
      proxy: {
        "/__functions": functionsProxy,
        "/functions": functionsProxy,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Raise chunk size warning threshold to 600 KB (from default 500 KB)
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("@firebase") || id.includes("firebase/")) return "firebase";

            if (id.includes("recharts")) return "charts";

            // Animation library — heavy, only needed for animated pages
            if (id.includes("framer-motion")) return "framer-motion";

            // Icon library — tree-shaking helps but still worth isolating
            if (id.includes("lucide-react")) return "lucide";

            // Radix / shadcn UI primitives
            if (id.includes("@radix-ui")) return "radix-ui";

            // TanStack Query
            if (id.includes("@tanstack/react-query")) return "react-query";

            // Everything else in node_modules → vendor
            if (id.includes("node_modules")) return "vendor";
          },
        },
      },
    },
  };
});
