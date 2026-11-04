# CASINO content migration

## Editing content

- `dist/data/lab.json`: the live content file, matching `contracts/models.ts`.
- `dist/assets/people/`: 12 downloaded member portraits, with original image bytes.
- `dist/assets/group-photo.png`: the group photograph supplied in this chat.
- `dist/assets/casino-symbol.svg`: the symbol-only logo selected by `siteSettings.logoAssetId`.
- `dist/assets/casino-logo.svg`: the full vector logo, also available in the assets collection.

Change a person's name, interests or biography in `people`; change paper metadata in `publications`. Update `assets[].url` to replace a picture. Paths such as `./assets/people/ben.jpg` resolve relative to `lab.html`, not relative to the JSON file. Add an asset entry and reference its ID when adding a new portrait or photo. Array order is significant for paper authors and the homepage photo list.

The frontend fetches JSON at startup. Serve the site over HTTP; opening `lab.html` through `file://` cannot fetch JSON reliably. From the project directory:

```sh
python3 -m http.server 4173 --directory dist
```

Open `http://127.0.0.1:4173/lab.html#home`. The root URL and the original `#human` preview also lead to this version.

Only published, non-demo records belong in the deployed JSON. This is a public static content file, not a private CMS database. A future backend can implement the contract in `contracts/README.md`; no backend authentication or database has been added.

## Imported content

The live HTML was checked on 4 November 2026. The source pages are:

- [Home](https://crab.ye.wang/home): group description, departments, research areas, collaboration and the 2025 security grand-slam statement.
- [Members](https://crab.ye.wang/members): 12 people, including 10 current members and 2 alumni; all portraits and linked profiles.
- [Publications](https://crab.ye.wang/publications): 52 records, grouped as 2026: 18, 2025: 16, 2024: 8, 2023: 10. The pre-2023 archive link is retained.
- [Applicant information](https://crab.ye.wang/info): UM/external applicant requirements, timeline, program structure and funding guidance.
- [Principal investigator](https://www.ye.wang/): biography and contact address.

Current branding is CASINO; the former CRAB name remains in the historical description. Main publication-page metadata takes precedence over duplicate entries on member pages. Author order and author spelling are preserved; recognized name variants link to a stable person ID. Venue type is normalized to conference, journal or workshop. Publication dates, DOI, abstracts, contributions, publication status, PDF links and BibTeX absent from the source remain null.

Research areas retain the source's two categories. Member-area associations are inferred from their explicitly listed interests. The source does not assign research areas to each paper, so `researchAreaIds` remains empty for papers; fill it after lab review. The frontend displays topic filters once tagged papers exist. The source has no dated news feed, so `news` is empty; the News & lab life page displays the supplied group photograph.

## Source discrepancies to review

1. The live directory places Molly Zhuangtong Huang in Alumni (PhD, October 2026), although her older profile and search caches still say PhD Student. Directory status is used. Brian Jincheng Yu is listed as MSc, June 2025. Exact graduation days are not given, so membership dates remain null and month-level information stays in the biography.
2. Yangxin Chen's visible email is `yc67847@um.edu.mo`, but the source mailto target is `yc67537@um.edu.mo`. His publicEmail is null until confirmed; the original profile and personal website remain linked.
3. Maury Junjie Qing and Green Chunlin Wang both list `yc67537@um.edu.mo`. These visible addresses are preserved for review.
4. One member profile additionally lists “Safeguarding the Unseen: a Study on Data Privacy in DeFi Protocols” without a year. The title, authors and venue are retained in Molly's biography, outside the dated publication archive.
5. “Janice Janing Si” appears in one paper's author line. The spelling remains as published on the source page and is linked to Janice Jianing Si's profile.
6. “Exploring User Perceptions of Security Auditing in the Web3 Ecosystem” lists both NDSS and SBC. Both venues are kept in the same record, as on the original main archive.
7. Recruitment deadlines and stipend figures come from the published guidance; visitors are directed to the current call before applying. No specific-year deadline was inferred.
8. The supplied group photograph is a screenshot with baked-in gallery arrows. It is displayed intact; an original photo can replace the file later.

## Checks and re-import

```sh
node scripts/check-live-data.mjs
node qa-lab.mjs
```

The data check validates the actual JSON against TypeScript types, record counts, public visibility, relationships and local image files. It runs TypeScript through npx. Browser QA uses the site on port 4173 and a Chrome debugging endpoint on port 9224; it checks desktop/mobile routes, portraits, filters, pagination, author links, photo dialogs, keyboard focus, application checklists and text escaping. Screenshots go to `previews/gold-json/`.

`scripts/migrate-crab.py` reproduces the initial migration using BeautifulSoup and a source cache under `/tmp/casino-crab-import-20261104`. Running it replaces `dist/data/lab.json` and imported portraits: use it only before manual content edits, or review its output in a separate checkout. The cache freezes this migration's source snapshot; re-importing new website changes requires deliberately refreshing that cache and reviewing source differences.
