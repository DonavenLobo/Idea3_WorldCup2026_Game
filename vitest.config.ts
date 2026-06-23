import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const resolvePkg = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@gogaffa/config": resolvePkg("./packages/config/src/index.ts"),
      "@gogaffa/types": resolvePkg("./packages/types/src/index.ts"),
      "@gogaffa/game-engine": resolvePkg("./packages/game-engine/src/index.ts"),
      "@gogaffa/card-renderer": resolvePkg("./packages/card-renderer/src/index.ts"),
      "@gogaffa/ui": resolvePkg("./packages/ui/src/index.ts")
    }
  },
  test: {
    environment: "node",
    include: [
      "scripts/**/*.test.mjs",
      "packages/**/*.test.ts",
      "apps/**/src/**/*.test.ts"
    ]
  }
});
