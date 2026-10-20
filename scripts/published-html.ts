import { readFile, writeFile } from 'node:fs/promises';
import type { AstroIntegration } from 'astro';
import { format } from 'prettier';

export function readableHTML(): AstroIntegration {
  return {
    name: 'readable-html',
    hooks: {
      'astro:build:done': async ({ dir, pages }) => {
        for (const page of pages) {
          const file = new URL(`${page.pathname}index.html`, dir);
          const html = await readFile(file, 'utf8');
          await writeFile(file, await format(html, {
            parser: 'html', printWidth: 100, tabWidth: 2,
            htmlWhitespaceSensitivity: 'css', embeddedLanguageFormatting: 'auto',
          }));
        }
      },
    },
  };
}
