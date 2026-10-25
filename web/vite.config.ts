import { defineConfig } from "vite";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";


// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return id
                .toString()
                .split("node_modules/")[1]
                .split("/")[0]
                .toString();
            }
          },
        },
      },
    },
    worker: {
      format: "es",
    },
    server:
      command !== "serve"
        ? undefined
        : {
            headers: {
              "Cross-Origin-Embedder-Policy": "require-corp",
              "Cross-Origin-Opener-Policy": "same-origin",
            },
          },
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        "#": path.resolve(__dirname, "./src"),
        "#packages": path.resolve(__dirname, "./packages"),
      },
    },
  };
});
