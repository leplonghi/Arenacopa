import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Garantir uma única instância de React em todo o bundle
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  // Fix: esbuild pre-bundla deps com NODE_ENV=production por padrão,
  // o que faz react/jsx-dev-runtime exportar jsxDEV = void 0.
  // Forçar development aqui garante que o runtime de DEV seja usado.
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-dev-runtime", "react/jsx-runtime"],
    esbuildOptions: {
      define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames(assetInfo) {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("firebase/auth") || id.includes("@firebase/auth")) {
            return "firebase-auth";
          }
          if (id.includes("firebase/firestore") || id.includes("@firebase/firestore")) {
            return "firebase-firestore";
          }
          if (id.includes("firebase/storage") || id.includes("@firebase/storage")) {
            return "firebase-storage";
          }
          if (id.includes("firebase/app") || id.includes("@firebase/app")) {
            return "firebase-core";
          }
          if (id.includes("firebase")) {
            return "firebase-misc";
          }
          if (id.includes("@tanstack")) {
            return "data";
          }
          if (id.includes("@radix-ui")) {
            return "ui";
          }
          if (id.includes("framer-motion")) {
            return "motion";
          }
          if (id.includes("recharts") || id.includes("embla-carousel-react") || id.includes("html-to-image")) {
            return "visual";
          }
          if (id.includes("i18next")) {
            return "i18n";
          }
          if (id.includes("react-router-dom")) {
            return "routing";
          }
          if (id.includes("lucide-react")) {
            return "icons";
          }
          if (id.includes("@capacitor")) {
            return "platform";
          }

          return "vendor";
        },
      },
    },
  },
}));
