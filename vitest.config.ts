import { defineConfig } from "vitest/config";

// Integration tests (test/integration/) only run when RUN_INTEGRATION=1.
const integration = process.env.RUN_INTEGRATION === "1";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: integration ? ["node_modules/**"] : ["node_modules/**", "test/integration/**"],
  },
});
