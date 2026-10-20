# Working on the CV

Read [ARCHITECTURE.md](ARCHITECTURE.md) for the content and rendering boundaries and [README.md](README.md) for local commands.

- Run `nix develop` and `npm ci` for Node 24 and matching Playwright browsers.
- Keep the content schema and `.pages.yml` form aligned. Test accepted and rejected data through their public interfaces.
- Preserve the screen layout and print pagination when changing markup, typography, or SCSS. Check desktop, mobile light/dark, and the attached A4 PDF.
- Keep fonts, icons, and photos local. The published page must work with JavaScript disabled and external requests blocked.
- Run `npm run check`, `npm test`, and `npm run test:e2e` before committing changes that affect behavior.
- Keep README and architecture documentation consistent with changes to publishing, data, or rendering.
