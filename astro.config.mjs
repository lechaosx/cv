import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dlabaja.eu',
  output: 'static',
  vite: {
    // direnv links nixpkgs into .direnv; watching it exhausts file watchers.
    server: { watch: { ignored: ['**/.direnv/**'] } },
  },
});
