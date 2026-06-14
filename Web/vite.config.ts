import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The native app loads this two ways:
//   DEBUG   -> the dev server below (http://localhost:5173) for hot reload
//   RELEASE -> the built output, served from the app bundle over app://local/
//
// `base: "./"` keeps asset URLs relative so they resolve against the custom
// scheme's origin. The build lands directly in the Swift app's Resources so
// it gets bundled (see Makefile `web` target + project.yml folder reference).
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../Resources/web",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
