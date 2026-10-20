# Architecture

Astro generates one HTML page from `src/content/cv.yaml`. The content collection validates the data with `src/cv.ts` during the build. Empty CMS list rows are discarded at validation; partially filled entries remain errors. The published site contains HTML, CSS, fonts, and images; all rendering assets are local.

Experience and education share a timeline entry shape. Descriptions are plain text, dates remain strings, links allow HTTP(S), and portraits resolve under `/uploads/`. The CMS exposes sidebar and accent colors as hex values. Detailed typography, layout, and component colors belong to the local SCSS.

SCSS controls the screen and print layout. At desktop widths and when printing, the photo/sidebar use the dark palette and the right column uses the light palette. Narrow screens follow the browser’s color preference; phone timeline metadata stacks above descriptions to preserve readable text width through screen-only styles. Print color preservation requires background graphics enabled in the print dialog.

Pages CMS commits directly to the content file. Its form configuration is `.pages.yml`; tests exercise form payloads and YAML round trips against the build schema. GitHub Actions checks every content or code change before publishing `dist/`.

This repository owns its renderer, styles, content, and deployment.
