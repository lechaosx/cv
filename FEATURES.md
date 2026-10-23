# Product decisions

## English and Czech [Explicit]

Each language has a directly linkable CV and prints its own content. The homepage uses the saved choice or browser language, with English available when JavaScript is disabled. Switching language keeps the controls in view and preserves keyboard focus and browser history.

## Screen preferences and print [Explicit]

Narrow screens follow the system theme until the reader saves a light/dark choice with the theme button. Compact square controls sit at the bottom of the desktop sidebar and follow Connect on narrow screens. Desktop and print keep the CV's mixed palette, and page controls stay out of the PDF.

## Responsive reading order [Explicit]

Small screens let names wrap beside contacts before stacking them, stack timeline details, and move Connect after the career history. Longer tablet paragraphs keep a comfortable line length; desktop and print retain the sidebar layout. Phone, email and visible profile links are reachable by keyboard; names, headings, dates and badges wrap between words, while only prose can split a word.

## Editable content [Explicit]

Pages CMS edits both translations together without a live editing interface. Descriptions support Markdown paragraphs, achievement lists, emphasis, and links. Dates accept years or month/year, ongoing roles stay open-ended, and completion dates can stand alone.

## Career presentation [Explicit]

A personal headline introduces the CV separately from the profession. Concise experience descriptions and technology badges carry technical and leadership evidence without a separate skills section; the website and one-page PDF contain the same content.

## Discovery and sharing [Explicit]

Search results and share previews follow the page language, with one identity across translations. All crawlers are allowed; the sitemap lists the two canonical CV pages.

## Readable exports [Explicit]

Each language has a Markdown CV; a bilingual full export and compact `llms.txt` index make the same facts available to text readers and assistants. All exports follow the edited content, without another document to maintain.

## One-page PDF downloads [Explicit]

Each language offers a selectable-text A4 PDF at the largest scale that fits one page. Publishing prepares static downloads; development downloads reflect current edits without a build. Download URLs and filenames include the person’s name and language for easy sharing and identification.

## Small PDF text warning [Explicit]

When fitting a PDF to one page shrinks its body text below 9pt, the build and development downloads warn instead of failing, prompting the editor to shorten the content.

## Source greeting [Explicit]

View Source includes a small greeting and a link to the repository for curious readers.
