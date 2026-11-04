# CASINO website prototype

The selected third direction now opens `dist/lab.html`. The original Ivory and Forest concepts remain accessible from the footer. The site is English-only and works as static files or through hosting.

| Page | Implemented interactions |
| --- | --- |
| Home | Supplied group photo, full-image dialog, research links, news and recruitment entry points |
| Research | Four topic pages with questions, tags, and links to pre-filtered publications |
| People | Name/interest search, role filters, member profile dialogs, PI website link |
| Publications | Text search; year, type and topic filters; chronological sorting; empty state; abstract dialog; BibTeX copy/download |
| News | Category filters and individual story pages, including the supplied group photo |
| Join us | Applicant-specific accordions, preparation checklist, email link/copy and full recruitment guidance |

Shared: mobile menu, active navigation, hash deep links, browser Back/Forward, keyboard focus and Escape dismissal for dialogs. Every page has the full logo. Main text is 18–20px; page backgrounds are ivory and pale sage.

## Content to supply

- Actual publication records: title, authors, year, venue, abstract, topic, DOI/PDF/project links and BibTeX. Existing records are explicitly labeled Sample and export as samples.
- Member names, roles, portraits, biographies, personal websites and alumni destinations. Only the PI profile is factual; the remaining profiles are labeled Sample.
- Real event and news entries. The example seminar is labeled Sample.
- The original group photograph if available: the supplied screenshot includes left/right gallery arrows as image pixels. The image is displayed intact and opens at full size.

Data lives in the small arrays at the beginning of `dist/lab.js`. No CMS, database or submission backend has been added. Application checkboxes are local to the current view; the email button opens the visitor's mail client. External links are actual sources, not fake download buttons.

## Verified sources

- https://crab.ye.wang/home — research areas and group leadership
- https://www.ye.wang/ — PI biography and contact address
- https://crab.ye.wang/info — full recruitment guidance; detailed eligibility and deadlines remain on that authoritative page

## Browser checks

`node qa-lab.mjs` checks the local site at port 4173 using a local Chrome debugging endpoint at port 9224. It exercises page navigation, desktop/mobile width, combined publication filters, empty results, profile/citation dialogs, restored focus, cross-page topic links, browser Back, news filters, the checklist and mobile navigation. Screenshots are saved under `previews/nov04/`.
