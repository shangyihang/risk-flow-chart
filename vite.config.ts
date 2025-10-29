import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'RiskFlowChart',
      fileName: (format) => (format === 'es' ? 'index.es.js' : 'index.js'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'vue'
      ],
      output: {
        // Avoid Rollup warning about mixing default and named exports
        // by emitting named exports for CommonJS output.
        exports: 'named',
        globals: {
          vue: 'Vue'
        },
      },
    },
  },
});