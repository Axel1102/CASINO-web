# CASINO website prototype

The selected third direction opens `dist/lab.html`, with its original warm-paper, green and gold palette, larger typography and a symbol-only top-left logo. Homepage and footer use the CASINO wordmark. The website uses English interface text and loads `dist/data/lab.json` over HTTP.

| Page | Implemented interactions |
| --- | --- |
| Home | Four subtly stacked photos; large previous/next arrows on both sides; short slide/fade transitions respecting reduced-motion preferences; top-aligned branding and recent papers below their heading |
| Member | 12 real profiles and portraits; role/alumni filters; clickable names; personal pages directly list papers; no directory interests or profile buttons |
| Publications | 52 records; year/type filters, chronological sorting, pagination; titles open Paper.pageUrl; optional abstract/BibTeX/PDF controls appear only when supplied |
| News | JSON-backed story pages and a group photo; the source has no dated news records |
| Contact | Applicant-specific accordions, source application materials as bullet lists, email link/copy and recruitment guidance |

Shared: sticky sage navigation with the logo on an ivory backing, mobile menu, hash deep links, browser Back/Forward, keyboard focus and Escape dismissal for dialogs. Contact has no active-state underline. Every page has the vector emblem in its header; the bottom footer reads CASINO@UMAC. Main text is 20–22px. Layout uses the original third direction's rounded cards and green/gold sections. The Research page and homepage research-area section have been removed; research metadata remains available in JSON.

## Content to supply

- Optional publication enrichment: abstracts, reviewed research-area assignments, DOI/PDF/project links and verified BibTeX. Missing metadata stays null and has no placeholder buttons.
- New event/news entries and future member updates. Review the source email discrepancies in `CONTENT-MIGRATION.md`.
- Verified external paper-page URLs can replace the working internal pageUrl links.

Content lives in `dist/data/lab.json`; images use local paths in its assets collection. Each record becomes a Member or Paper instance from `dist/models.js`. Search boxes and the footer link collection have been removed. No CMS, database or submission backend has been added. Email links open the visitor's mail client. See `CONTENT-MIGRATION.md` for source coverage and content-editing instructions.

## Verified sources

- https://crab.ye.wang/home — research areas and group leadership
- https://www.ye.wang/ — PI biography and contact address
- https://crab.ye.wang/info — full recruitment guidance; detailed eligibility and deadlines remain on that authoritative page

## Browser checks

`node qa-lab.mjs` checks port 4173 using Chrome debugging port 9224. It covers desktop/mobile routes, sticky navigation, homepage alignment, portraits, filters, pagination, inline papers, PI links, photo switching, dialogs, scoped materials lists and legacy URLs. Screenshots are saved under `previews/gold-json/`.
