import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
const rootFolder = process.env.VITE_ROOT_FOLDER || "";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: rootFolder,
  // server: {
  //   proxy: {
  //     "/SQLAPI": {
  //       target: "https://customerapi.quadranet.co.uk",
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
});
