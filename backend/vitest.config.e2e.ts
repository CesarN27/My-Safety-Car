import { defineConfig } from 'vitest/config';

// Las pruebas e2e se compilan antes con tsc (tsconfig.e2e.json): esbuild no emite los metadatos
// de decoradores que Nest y TypeORM necesitan.
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['dist-e2e/test/**/*.e2e-spec.js'],
    fileParallelism: false,
    env: { NODE_ENV: 'test', DB_NAME: 'tecnocar_test' },
  },
});
