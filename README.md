# Drahomír’s CV

A static bilingual CV for https://dlabaja.eu, edited in Pages CMS or `src/content/cv.yaml` and published with GitHub Pages.

## Development

```sh
nix develop
npm ci
npm run dev
```

Run `npm run check`, `npm test`, and `npm run test:e2e` before publishing; browser checks attach English and Czech A4 PDFs. The Nix shell supplies Node 24 and matching Playwright browsers. `npm run build` writes `dist/`; `npm run preview` serves it.

## Editing

Open this repository in [Pages CMS](https://app.pagescms.org) and edit the CV on `master`. Fill both translations of prose; leave both empty to omit an optional field. Dates use quoted `2023` or `3/2023`: a start alone means ongoing, an end alone means a completion date. Portraits belong in `public/uploads`; clearing a color restores the stylesheet default.

## Publishing and printing

Configure GitHub Pages to use **GitHub Actions**, set its custom domain to `dlabaja.eu`, and [configure DNS and HTTPS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site). Keep `astro.config.mjs` and `public/CNAME` aligned with the domain. Pushes to `master` publish after checks pass; pull requests run checks only.

For PDFs, select the desired language, use A4 portrait at 100% scale, enable background graphics, and disable browser headers and footers. Browser versions and print margins can affect pagination.

[Product decisions](FEATURES.md) · [Technical decisions](ARCHITECTURE.md)
