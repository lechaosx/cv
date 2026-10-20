import { defineConfig, mergeConfig } from 'astro/config';
import config from '../astro.config.mjs';

export default mergeConfig(config, defineConfig({
  srcDir: './tests/fixtures',
  outDir: './dist-e2e',
  cacheDir: './node_modules/.astro-e2e',
  integrations: [{
    name: 'browser-fixtures',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({ pattern: '/', entrypoint: './tests/fixtures/CV.astro' });
        injectRoute({ pattern: '/[lang]/', entrypoint: './tests/fixtures/CV.astro' });
      },
    },
  }],
}));
