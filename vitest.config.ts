import { defineConfig } from "vitest/config";

// Standalone config so Vitest doesn't load the crx() extension plugin.
export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        // Process real CSS (modules + ?inline) so the chat export's inlined
        // styles are exercised instead of stubbed.
        css: true,
    },
});
