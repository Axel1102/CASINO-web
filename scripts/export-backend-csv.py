"""Export the public CASINO snapshot using the selected backend's CSV contract."""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys


def convert(snapshot, *, alumni_dates=False):
    now = datetime.now(timezone.utc)

    def public(row):
        return (row["publishState"] == "published" and not row["isDemo"]
                and row["publishedAt"] and datetime.fromisoformat(row["publishedAt"]) <= now)

    def photo(asset):
        return {"url": asset["url"], "metadata": {
            key: asset[key] for key in ("mimeType", "alt", "caption", "credit")
        }}

    assets = {row["id"]: row for row in snapshot["assets"]}
    rows = {"assets": [], "people": [], "publications": []}
    for asset_id in snapshot["siteSettings"]["heroPhotoAssetIds"]:
        entry = photo(assets[asset_id])
        entry["metadata"]["purpose"] = "group_photo"
        rows["assets"].append({"id": asset_id, **entry})

    for person in filter(public, snapshot["people"]):
        full_name = person["name"].split(",", 1)[0].strip()
        given, separator, family = full_name.rpartition(" ")
        if not separator or family.casefold() != person["familyName"].casefold():
            raise ValueError(f"Review givenName/familyName for {person['id']}")
        memberships = [{k: role[k] for k in ("role", "isCurrent")} for role in person["memberships"]]
        if any(role["isCurrent"] for role in memberships) != (person["state"] == "member"):
            raise ValueError(f"state and memberships disagree for {person['id']}")
        rows["people"].append({
            "id": person["id"], "familyName": person["familyName"], "givenName": given,
            "englishName": person["preferredName"], "title": person["title"] or "",
            "portrait": photo(assets[person["portraitAssetId"]]) if person["portraitAssetId"] else None,
            "bioMarkdown": person["bioMarkdown"] or "", "interests": person["interests"],
            "memberships": memberships, "publicEmail": person["publicEmail"], "links": person["links"],
        })
        if alumni_dates:
            rows["people"][-1]["alumniSince"] = person["alumniSince"]

    # The backend returns reverse insertion order. Preserve the snapshot list order.
    for paper in filter(public, reversed(snapshot["publications"])):
        if paper["pdfUrl"] or not paper["pageUrl"].startswith("#publications/"):
            raise ValueError(f"Review external paper/PDF links for {paper['id']} before importing")
        pdf = assets[paper["pdfAssetId"]]["url"].removeprefix(".") if paper["pdfAssetId"] else None
        rows["publications"].append({
            "id": paper["id"], "title": paper["title"], "year": paper["year"], "type": paper["type"],
            "venue": {key: paper["venue"][key] or "" for key in ("name", "shortName")},
            "authors": [{k: author[k] for k in ("personId", "name")} for author in paper["authors"]],
            "pdfPath": pdf, "sourceUrl": "",
        })
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backend", required=True, type=Path, help="Trusted lab_backend checkout")
    parser.add_argument("--source", default=Path("dist/data/lab.json"), type=Path)
    parser.add_argument("--output", required=True, type=Path, help="New CSV directory outside the repositories")
    args = parser.parse_args()
    sys.path.insert(0, str(args.backend.resolve(strict=True)))
    from lab_backend.models import FILES, MODELS
    from lab_backend.store import encode_csv

    rows = convert(json.loads(args.source.read_text(encoding="utf-8")),
                   alumni_dates="alumniSince" in MODELS["people"].model_fields)
    people_ids = {person["id"] for person in rows["people"]}
    encoded = {}
    for resource, entries in rows.items():
        if len({row["id"] for row in entries}) != len(entries):
            raise ValueError(f"Duplicate IDs in {resource}")
        if resource == "publications":
            for row in entries:
                if any(a["personId"] is not None and a["personId"] not in people_ids for a in row["authors"]):
                    raise ValueError(f"Unknown author personId in {row['id']}")
        checked = [MODELS[resource].model_validate(row).model_dump() for row in entries]
        encoded[FILES[resource]] = encode_csv(resource, checked, private=False)

    args.output.mkdir(mode=0o700)  # Refuse an existing directory.
    for name, csv_text in encoded.items():
        with (args.output / name).open("x", encoding="utf-8", newline="") as file:
            file.write(csv_text)
    print(", ".join(f"{key}: {len(value)}" for key, value in rows.items()))


if __name__ == "__main__":
    main()
