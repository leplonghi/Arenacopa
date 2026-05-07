import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const functionsTarget = env.VITE_FIREBASE_PROJECT_ID
    ? `https://us-central1-${env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`
    : undefined;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: functionsTarget
        ? {
            "/__functions": {
              target: functionsTarget,
              changeOrigin: true,
              secure: true,
              rewrite: (url) => url.replace(/^\/__functions/, ""),
            },
          }
        : undefined,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-dev-runtime", "react/jsx-runtime"],
    },
    build: {
      target: "esnext",
      minify: "esbuild",
      cssMinify: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
          manualChunks(id) {
            if (id.includes("node_modules")) {
              // Core frameworks
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
                return "vendor-core";
              }
              // Data fetching & State
              if (id.includes("@tanstack") || id.includes("firebase")) {
                return "vendor-data";
              }
              // UI & Icons
              if (id.includes("lucide-react") || id.includes("@radix-ui")) {
                return "vendor-ui";
              }
              // Animations
              if (id.includes("framer-motion")) {
                return "vendor-animations";
              }
              // Misc (i18n, charts, etc)
              return "vendor-misc";
            }
          },
        },
      },
    },
  };
});
