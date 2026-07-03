import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

// Builds a single self-executing script embeddable via:
//   <script src=".../widget.js" data-tenant="my-tenant-slug"></script>
// No external chunks/CSS files — everything (JS + injected shadow-DOM styles) lives in one file.
export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: 'src/index.ts',
      name: 'NextLevelWidget',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
