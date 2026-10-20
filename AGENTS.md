# Working on the CV

Keep documentation in the same change as the behavior it describes: [README.md](README.md) covers running, editing and publishing; [FEATURES.md](FEATURES.md) records product decisions; [ARCHITECTURE.md](ARCHITECTURE.md) records technical decisions. Each decision gets a tagged heading and one to three sentences of what and why: **[Explicit]** when requested or chosen by the user, **[Implicit]** otherwise. Leave mechanisms and edge cases to code and tests.

- Run `nix develop` and `npm ci` for Node 24 and matching Playwright browsers.
- Keep the content schema and `.pages.yml` form aligned. Test accepted and rejected data through their public interfaces.
- Preserve the screen layout and print pagination when changing markup, typography, or SCSS. Check desktop, mobile light/dark, and the attached A4 PDF.
- Keep fonts, icons, and photos local. The published page must work with JavaScript disabled and external requests blocked.
- Keep translated fields paired and all generated exports on the same content source. Keep `astro.config.mjs` and `public/CNAME` aligned for root-domain hosting.
- Keep browser fixtures independent of CMS data and out of `dist/`, the production artifact.
- Run `npm run check`, `npm test`, and `npm run test:e2e` before committing changes that affect behavior.
