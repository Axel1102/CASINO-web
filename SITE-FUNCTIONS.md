# CASINO website prototype

The selected third direction opens `dist/lab.html`, with its original warm-paper, green and gold palette, larger typography and a symbol-only header logo. The original Ivory and Forest concepts remain accessible from the footer. The website uses English interface text and loads `dist/data/lab.json` over HTTP.

| Page | Implemented interactions |
| --- | --- |
| Home | Supplied group photo, full-image dialog, research links, news and recruitment entry points |
| Research | Four topic pages with questions, tags, and links to pre-filtered publications |
| People | 12 real profiles and portraits, name/interest search, current-role/alumni filters, profile deep links, related publications |
| Publications | 52 real records; text/year/type filters, chronological sorting, 12-item pagination, author/profile links, publication detail pages; optional abstract/BibTeX/PDF controls appear only when supplied |
| News | JSON-backed story pages and the supplied group photo; the source has no dated news records |
| Join us | Applicant-specific accordions, preparation checklist, email link/copy and full recruitment guidance |

Shared: mobile menu, active navigation, hash deep links, browser Back/Forward, keyboard focus and Escape dismissal for dialogs. Every page has the vector emblem in its header. Main text is 20–22px. Layout uses the original third direction's rounded cards and green/gold sections.

## Content to supply

- Optional publication enrichment: abstracts, reviewed research-area assignments, DOI/PDF/project links and verified BibTeX. Missing metadata stays null and has no placeholder buttons.
- New event/news entries and future member updates. Review the source email discrepancies in `CONTENT-MIGRATION.md`.
- The original group photograph if available: the supplied screenshot includes left/right gallery arrows as image pixels. The image is displayed intact and opens at full size.

Content lives in `dist/data/lab.json`; images use local paths in its assets collection. No CMS, database or submission backend has been added. Application checkboxes are local to the current view; email links open the visitor's mail client. See `CONTENT-MIGRATION.md` for source coverage and content-editing instructions.

## Verified sources

- https://crab.ye.wang/home — research areas and group leadership
- https://www.ye.wang/ — PI biography and contact address
- https://crab.ye.wang/info — full recruitment guidance; detailed eligibility and deadlines remain on that authoritative page

## Browser checks

`node qa-lab.mjs` checks the local site at port 4173 using a Chrome debugging endpoint at port 9224. It covers desktop/mobile routes, JSON loading, portraits, search, combined filters, pagination, empty results, author/profile navigation, photo-dialog focus, browser Back, the checklist, mobile navigation and text escaping. Screenshots are saved under `previews/gold-json/`.
