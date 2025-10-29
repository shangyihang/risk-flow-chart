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
        'vue',
        'ant-design-vue',
        '@ant-design/icons-vue',
        '@antv/x6',
        '@antv/x6-plugin-clipboard',
        '@antv/x6-plugin-dnd',
        '@antv/x6-plugin-history',
        '@antv/x6-plugin-keyboard',
        '@antv/x6-plugin-selection',
        '@antv/x6-plugin-snapline',
        '@antv/x6-plugin-transform',
      ],
      output: {
        // Avoid Rollup warning about mixing default and named exports
        // by emitting named exports for CommonJS output.
        exports: 'named',
        globals: {
          vue: 'Vue',
          'ant-design-vue': 'antd',
          '@ant-design/icons-vue': 'AntDesignIconsVue',
          '@antv/x6': 'X6',
        },
      },
    },
  },
});