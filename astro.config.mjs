import { defineConfig } from 'astro/config';
import { developmentPDFs } from './scripts/dev-pdf.ts';
import { readableHTML } from './scripts/published-html.ts';

export default defineConfig({
  site: 'https://dlabaja.eu',
  output: 'static',
  compressHTML: false,
  build: { assets: 'assets' },
  integrations: [developmentPDFs(), readableHTML()],
  vite: {
    // direnv links nixpkgs into .direnv; watching it exhausts file watchers.
    server: { watch: { ignored: ['**/.direnv/**'] } },
    build: {
      sourcemap: false,
      rolldownOptions: {
        output: {
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash][extname]',
        },
      },
    },
  },
});
