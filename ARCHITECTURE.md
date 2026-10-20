# Architecture

## Static pages and progressive controls [Implicit]

Astro renders the CV at build time so reading and printing need no JavaScript or external services. Small browser scripts select preferences; the full document and language links remain usable without them.

## Shared facts, paired translations [Implicit]

One content file keeps contact details, dates, credentials, and technical skills shared while translated prose stays in English/Czech pairs. Build validation and the Pages CMS form must agree so publishing cannot silently omit a translation.

## Local rendering and ownership [Implicit]

SCSS preserves the established screen and print design; fonts, icons, and the portrait stay local. Each person's repository owns its renderer and content, allowing their designs to diverge independently.

## One publishing source [Explicit]

HTML, metadata, structured identity and Markdown exports use the same validated content so edits cannot leave a second CV behind. URLs derive from the configured custom-domain origin; machine-readable facts contain only supplied information.

## Stable browser fixtures [Explicit]

Browser layout and preference checks render the production template with test-owned content so ordinary CV edits do not break them. Their separate output directory keeps fixtures out of the published artifact; production export checks still exercise the current CV.
