#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DATABASE_PATH = ROOT / "backend" / "data" / "provider_index.sqlite"
OUTPUT_PATH = ROOT / "docs" / "tree-image-license-audit.md"

CURATED_KEYWORDS = (
    "linden",
    "ginkgo",
    "sophora",
    "pagoda",
    "oak",
    "zelkova",
    "sweetgum",
    "lilac",
    "honeylocust",
    "honey locust",
    "gleditsia",
)

ALLOWED_LICENSES = {
    "Public domain",
    "CC0",
    "CC BY 2.0",
    "CC BY 2.5",
    "CC BY 3.0",
    "CC BY 4.0",
    "CC BY-SA 2.0",
    "CC BY-SA 2.5",
    "CC BY-SA 3.0",
    "CC BY-SA 4.0",
}

BAD_TITLE_HINTS = re.compile(
    r"(distribution|range|map|locator|icon|logo|symbol|diagram|pollen|seed|fruit|flower|leaf|leaves|bark)",
    re.I,
)
GOOD_IMAGE_EXTENSION = re.compile(r"\.(jpe?g|png|webp)$", re.I)
HTML_TAG = re.compile(r"<[^>]+>")
SPACE = re.compile(r"\s+")
NON_WORD = re.compile(r"[^a-z0-9]+")


def clean(value: Any) -> str:
    return SPACE.sub(" ", HTML_TAG.sub("", str(value or ""))).strip()


def normalized(value: str) -> str:
    return NON_WORD.sub(" ", value.lower()).strip()


def dictionary_values(database: sqlite3.Connection) -> dict[str, dict[int, str]]:
    values: dict[str, dict[int, str]] = {}
    for field, value_id, value in database.execute("SELECT field, value_id, value FROM dictionary_entries"):
      values.setdefault(field, {})[value_id] = value
    return values


def missing_species(database: sqlite3.Connection) -> list[dict[str, Any]]:
    values = dictionary_values(database)
    species: list[dict[str, Any]] = []
    rows = database.execute(
        "SELECT species_common, species_scientific, COUNT(*) FROM providers GROUP BY species_common, species_scientific ORDER BY species_common"
    )
    for common_id, scientific_id, count in rows:
        common = values["species_common"].get(common_id, str(common_id))
        scientific = values["species_scientific"].get(scientific_id, str(scientific_id))
        search_text = f"{common} {scientific}".lower()
        if any(keyword in search_text for keyword in CURATED_KEYWORDS):
            continue
        species.append(
            {
                "common": common,
                "scientific": scientific,
                "provider_count": count,
            }
        )
    return species


def commons_query(query: str, limit: int, wait: float) -> list[dict[str, Any]]:
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "format": "json",
        "formatversion": "2",
    }
    url = f"https://commons.wikimedia.org/w/api.php?{urlencode(params)}"
    request = Request(
        url,
        headers={
            "User-Agent": "PrimaryTreeProviderImageAudit/1.0 (https://primary-tree-provider.vercel.app)",
            "Accept": "application/json",
        },
    )

    for attempt in range(3):
        try:
            with urlopen(request, timeout=25) as response:
                data = json.loads(response.read().decode("utf-8"))
            time.sleep(wait)
            return data.get("query", {}).get("pages", [])
        except HTTPError as error:
            if error.code == 429:
                time.sleep(max(10, wait * 5) * (attempt + 1))
                continue
            raise
        except (TimeoutError, URLError, json.JSONDecodeError):
            time.sleep(max(1, wait) * (attempt + 1))
    return []


def candidate_score(candidate: dict[str, Any], common: str, scientific: str) -> int:
    title = normalized(candidate["title"].removeprefix("File:"))
    description = normalized(candidate["description"])
    categories = normalized(candidate["categories"])
    haystack = f"{title} {description} {categories}"
    scientific_text = normalized(scientific)
    scientific_parts = scientific_text.split()
    binomial = " ".join(scientific_parts[:2]) if len(scientific_parts) >= 2 else scientific_text
    common_text = normalized(common)

    score = 0
    if scientific_text and scientific_text in haystack:
        score += 100
    if binomial and binomial in haystack:
        score += 80
    if common_text and common_text in haystack:
        score += 25
    if re.search(r"(tree|habit|plant|whole|street|arboretum|garden|park)", candidate["description"] + " " + candidate["title"], re.I):
        score += 20
    if BAD_TITLE_HINTS.search(candidate["title"]):
        score -= 30
    else:
        score += 20
    return score


def find_candidate(common: str, scientific: str, limit: int, wait: float, scientific_only: bool) -> dict[str, Any] | None:
    if scientific_only:
        queries = [scientific or common]
    else:
        queries = [scientific]
        if common.lower() not in scientific.lower():
            queries.append(f"{common} {scientific}")
        queries.append(common)

    candidates: list[dict[str, Any]] = []
    seen: set[str] = set()
    for query in dict.fromkeys(q for q in queries if q):
        for page in commons_query(query, limit=limit, wait=wait):
            title = page.get("title", "")
            if title in seen:
                continue
            seen.add(title)
            info = (page.get("imageinfo") or [{}])[0]
            meta = info.get("extmetadata") or {}
            image_url = info.get("url", "")
            license_name = clean((meta.get("LicenseShortName") or {}).get("value"))
            if license_name not in ALLOWED_LICENSES:
                continue
            if not GOOD_IMAGE_EXTENSION.search(image_url.split("?")[0]):
                continue

            candidate = {
                "title": title,
                "image_url": image_url,
                "description_url": info.get("descriptionurl", ""),
                "license": license_name,
                "license_url": clean((meta.get("LicenseUrl") or {}).get("value")),
                "artist": clean((meta.get("Artist") or {}).get("value")),
                "credit": clean((meta.get("Credit") or {}).get("value")),
                "description": clean((meta.get("ImageDescription") or {}).get("value")),
                "categories": clean((meta.get("Categories") or {}).get("value")),
                "query": query,
            }
            candidate["score"] = candidate_score(candidate, common, scientific)
            candidates.append(candidate)

    candidates.sort(key=lambda item: item["score"], reverse=True)
    return candidates[0] if candidates else None


def format_markdown(rows: list[dict[str, Any]], *, checked: bool) -> str:
    found = sum(1 for row in rows if row.get("candidate"))
    lines = [
        "# Tree Image License Audit",
        "",
        "This report lists species in the SQLite provider network that do not yet have a curated app image source in `lib/treeImageSources.ts`.",
        "",
        f"- Missing curated species: {len(rows)}",
        f"- License-safe candidates found: {found}" if checked else "- License-safe candidates found: not checked in this run",
        "- Accepted licenses: public domain, CC0, CC BY, and CC BY-SA",
        "- Note: candidates are license-safe starting points; visually review them before promoting them into the product UI.",
        "",
        "| Species | Scientific name | Providers | Candidate image | License | Credit |",
        "| --- | --- | ---: | --- | --- | --- |",
    ]
    for row in rows:
        candidate = row.get("candidate")
        if candidate:
            image = f"[{candidate['title']}]({candidate['description_url']})"
            license_name = f"[{candidate['license']}]({candidate['license_url']})" if candidate["license_url"] else candidate["license"]
            credit = candidate["artist"] or candidate["credit"] or "See Commons page"
        else:
            query = quote(row["scientific"] or row["common"])
            image = f"[Needs manual review](https://commons.wikimedia.org/w/index.php?search={query}&title=Special:MediaSearch&type=image)"
            license_name = ""
            credit = ""
        lines.append(
            f"| {row['common']} | `{row['scientific']}` | {row['provider_count']} | {image} | {license_name} | {credit} |"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit PCT species without curated licensed image sources.")
    parser.add_argument("--check-commons", action="store_true", help="Query Wikimedia Commons for license-safe candidates.")
    parser.add_argument("--limit", type=int, default=8, help="Commons search result limit per query.")
    parser.add_argument("--wait", type=float, default=1.2, help="Seconds to wait after each Commons request.")
    parser.add_argument("--scientific-only", action="store_true", help="Only search Commons by scientific name.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    with sqlite3.connect(DATABASE_PATH) as database:
        rows = missing_species(database)

    if args.check_commons:
        for index, row in enumerate(rows, start=1):
            row["candidate"] = find_candidate(
                row["common"],
                row["scientific"],
                limit=args.limit,
                wait=args.wait,
                scientific_only=args.scientific_only,
            )
            status = row["candidate"]["license"] if row["candidate"] else "needs manual review"
            print(f"{index:03d}/{len(rows)} {row['common']}: {status}", flush=True)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(format_markdown(rows, checked=args.check_commons))
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
