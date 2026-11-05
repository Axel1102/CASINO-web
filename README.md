# CASINO Lab website

English website for the Collaborative Security and Interaction Group at the University of Macau.

## Run locally

No build step or frontend dependencies are required. From the repository root:

```sh
python3 -m http.server 4173 --directory dist
```

Open <http://localhost:4173/lab.html#home>. Use HTTP rather than opening the HTML directly: the website loads its content from JSON.

## Edit the website

- `dist/data/lab.json`: members, publications, application information, image paths and site settings.
- `dist/assets/`: SVG logos, member portraits and the four group photos.
- `dist/lab.js`, `dist/lab.html`, `dist/gold.css`: pages, interactions, shared navigation and current visual style.
- `dist/models.js`: one `Member` or `Paper` instance per JSON record. Member papers are linked through `authors[].personId`.
- `contracts/models.ts` and `contracts/README.md`: data types and proposed backend API contract.

Every paper has a `pageUrl`: an internal `#publications/{id}` detail page or a verified external paper-page URL. Image URLs are resolved relative to the HTML page.

Deploy the contents of `dist/` with any static web host. The current Sites deployment configuration is in `.openai/hosting.json`. There is no backend or CMS in this repository.

See [CONTENT-MIGRATION.md](CONTENT-MIGRATION.md) for source coverage and editing instructions, and [SITE-FUNCTIONS.md](SITE-FUNCTIONS.md) for page behavior. Migration scripts can overwrite manual content edits; review their output before re-importing.
