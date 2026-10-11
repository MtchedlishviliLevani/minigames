import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    port: 8080,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        // Test files exercise the application; they are not application logic themselves.
        'src/**/*.test.ts',
        // Shared test helpers (fetch mocks, fixtures) used only by the test suites.
        'src/test/**',
        // Entry point: imports global styles and calls startRouter() and mountApp() only.
        'src/main.ts',
        // Type declarations and interfaces; erased at build time, nothing executes.
        'src/types/**',
        'src/**/*.d.ts',
      ],
    },
  },
});
