# Drahomír’s CV

A static bilingual CV for https://dlabaja.eu, edited in Pages CMS or `src/content/cv.yaml` and published with GitHub Pages.

```sh
nix develop
npm ci
npm run dev
```

Run `npm run check`, `npm test`, and `npm run test:e2e` before publishing. Browser checks use stable fixtures in `dist-e2e/`; `dist/` remains the production build. The Nix shell supplies Node 24 and matching Playwright browsers.

## Editing

Edit `src/content/cv.yaml` directly or open this repository in [Pages CMS](https://app.pagescms.org) on `master`. Fill both translations of prose, or omit both.

## Publishing and printing

Configure GitHub Pages to use **GitHub Actions** and [configure the custom domain and HTTPS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site). Keep `astro.config.mjs` and `public/CNAME` aligned with the domain. Pushes to `master` publish after checks pass.

For PDFs, select the language, use A4 portrait at 100% scale, enable background graphics, and disable browser headers and footers. Browser versions and print margins can affect pagination.

[Product decisions](FEATURES.md) · [Technical decisions](ARCHITECTURE.md)
