import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Flags are fetched one at a time as needed: never inline ~260 SVGs into the JS bundle.
    assetsInlineLimit: (file) => (/\/assets\/(flags|quiz-images|illustrations)\//.test(file) ? false : undefined),
    // The geography chunk carries the world map + shapes (~70 kB gzip); keep the warning meaningful.
    chunkSizeWarningLimit: 400,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{js,jsx}"],
  },
});
