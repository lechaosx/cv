import type { AstroIntegration } from 'astro';
import { chromium } from '@playwright/test';
import { renderPDF } from './render-pdf.ts';

export function developmentPDFs(): AstroIntegration {
  return {
    name: 'development-pdfs',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        server.middlewares.use(async (request, response, next) => {
          const match = request.url?.match(/^\/(en|cs)\/cv\.pdf(?:\?.*)?$/);
          if (request.method !== 'GET' || !match) return next();
          let browser;
          try {
            const address = server.httpServer!.address();
            if (!address || typeof address === 'string') throw new Error('Development server has no TCP address');
            const host = address.family === 'IPv6' ? '[::1]' : '127.0.0.1';
            browser = await chromium.launch();
            const { bytes } = await renderPDF(browser, `http://${host}:${address.port}`, match[1] as 'en' | 'cs');
            response.writeHead(200, {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment',
              'Cache-Control': 'no-store',
            });
            response.end(bytes);
          } catch (error) {
            logger.error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
            response.end('PDF generation failed. See the development server log; Chromium must be installed.');
          } finally {
            await browser?.close();
          }
        });
      },
    },
  };
}
