import { defineConfig } from "vitest/config";

// Standalone config so Vitest doesn't load the crx() extension plugin.
export default defineConfig({
    // Mirror the build-time flag so code guarded by it runs under tests.
    define: {
        __IS_FIREFOX__: "false",
    },
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        // Process real CSS (modules + ?inline) so the chat export's inlined
        // styles are exercised instead of stubbed.
        css: true,
    },
});
