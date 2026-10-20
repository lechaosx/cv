# Drahomír’s CV

A static CV for https://dlabaja.eu. Content is edited through Pages CMS or `src/content/cv.yaml`. Saving to `master` runs validation and browser checks before GitHub Pages publishes the change.

## Development

```sh
nix develop
npm ci
npm run dev
```

`npm run check` checks types and Astro templates. `npm test` checks content validation and CMS compatibility. `npm run test:e2e` builds the site and checks screen and print rendering in Chromium, attaching an A4 PDF to the test results. The Nix shell provides Node 24 and matching Playwright browsers. Outside Nix, use Node 24 and run `npx playwright install --with-deps chromium` before browser tests.

`npm run build` writes the standalone site to `dist/`; `npm run preview` serves it locally.

## Editing

Sign in at https://app.pagescms.org with GitHub and grant the Pages CMS GitHub App access to this repository. Open the CV form on `master`. Uploaded portraits belong to `public/uploads`; their content paths start with `/uploads/`.

Descriptions are plain text. Timeline dates are quoted strings: years use `2023`, months use `01` through `12`. A start without an end means “present”; an end alone displays a single date. Leave optional fields empty to omit them. Empty color fields use the stylesheet palette. Colors use hex values, such as `#283649`.

## Publishing

In the repository’s GitHub Pages settings, select **GitHub Actions** as the source and configure `dlabaja.eu` as the custom domain. Configure DNS for GitHub Pages and enable HTTPS after the domain is verified. `astro.config.mjs` and `public/CNAME` must match the chosen domain. See [GitHub’s custom-domain setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

Pushes to `master` and manual workflow runs publish after checks pass. Pull requests run the same checks without publishing. Pages CMS needs repository write access; public site visitors need no account.

For PDF output, use A4 portrait at 100% scale, enable background graphics, and disable browser headers and footers. Pagination also depends on browser version and print margins.
