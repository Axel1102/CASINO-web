# CASINO website prototype

The selected third direction opens `dist/lab.html`, with its original warm-paper, green and gold palette, larger typography and a symbol-only top-left logo. Homepage and footer use the CASINO wordmark. The website uses English interface text and loads `dist/data/lab.json` over HTTP.

| Page | Implemented interactions |
| --- | --- |
| Home | Four original photos in a stacked album; previous/next controls, full-image dialog, highlighted CASINO letters in the full name |
| Research | Two source research areas and related content links |
| Member | 12 real profiles and portraits; role/alumni filters; clickable names; personal pages directly list papers; no directory interests or profile buttons |
| Publications | 52 records; year/type filters, chronological sorting, pagination; titles open Paper.pageUrl; optional abstract/BibTeX/PDF controls appear only when supplied |
| News | JSON-backed story pages and a group photo; the source has no dated news records |
| Contact | Applicant-specific accordions, preparation checklist, email link/copy and full recruitment guidance |

Shared: mobile menu, active navigation, hash deep links, browser Back/Forward, keyboard focus and Escape dismissal for dialogs. Every page has the vector emblem in its header. Main text is 20–22px. Layout uses the original third direction's rounded cards and green/gold sections.

## Content to supply

- Optional publication enrichment: abstracts, reviewed research-area assignments, DOI/PDF/project links and verified BibTeX. Missing metadata stays null and has no placeholder buttons.
- New event/news entries and future member updates. Review the source email discrepancies in `CONTENT-MIGRATION.md`.
- Verified external paper-page URLs can replace the working internal pageUrl links.

Content lives in `dist/data/lab.json`; images use local paths in its assets collection. Each record becomes a Member or Paper instance from `dist/models.js`. Search boxes and the footer link collection have been removed. No CMS, database or submission backend has been added. Application checkboxes are local to the current view; email links open the visitor's mail client. See `CONTENT-MIGRATION.md` for source coverage and content-editing instructions.

## Verified sources

- https://crab.ye.wang/home — research areas and group leadership
- https://www.ye.wang/ — PI biography and contact address
- https://crab.ye.wang/info — full recruitment guidance; detailed eligibility and deadlines remain on that authoritative page

## Browser checks

`node qa-lab.mjs` checks port 4173 using Chrome debugging port 9224. It covers desktop/mobile routes, JSON loading, portraits, combined filters, pagination, inline member papers, photo switching and dialog focus, browser Back, the checklist, mobile navigation and legacy URLs. Screenshots are saved under `previews/gold-json/`.
