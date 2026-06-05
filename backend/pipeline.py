import json
from urllib.parse import quote

from bs4 import BeautifulSoup
from fastapi import HTTPException
import requests

UA = {"User-Agent": "TheCourtroom/1.0"}

# Curated Wikidata properties worth turning into readable facts.
WIKIDATA_PROPERTIES = {
    "P106": "Occupation",
    "P27": "Country of citizenship",
    "P569": "Date of birth",
    "P570": "Date of death",
    "P19": "Place of birth",
    "P69": "Educated at",
    "P39": "Position held",
    "P166": "Awards received",
    "P101": "Field of work",
    "P135": "Movement",
    "P140": "Religion or worldview",
    "P1412": "Languages spoken",
}


def show_possible_options_of_personas_based_on_a_commom_name_or_description(
    persona_name: str,
):
    response = requests.get(
        f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={persona_name}&format=json",
        headers={"User-Agent": "TheCourtroom/1.0"},
    )

    data = json.loads(response.text)
    options = data["query"]["search"]

    if not options:
        raise HTTPException(
            status_code=404, detail="No persona found with provided name."
        )

    options_formatted = [
        {
            "name": BeautifulSoup(option["title"], "html.parser").get_text(strip=True),
            "description": BeautifulSoup(option["snippet"], "html.parser").get_text(
                strip=True
            ),
        }
        for option in options
    ]

    if len(options_formatted) > 1:
        return options_formatted


def _mediawiki_extract(api_url: str, title: str) -> str | None:
    """Fetch clean plain-text article content via a MediaWiki extracts API."""
    try:
        resp = requests.get(
            api_url,
            params={
                "action": "query",
                "prop": "extracts",
                "explaintext": 1,
                "redirects": 1,
                "titles": title,
                "format": "json",
            },
            headers=UA,
            timeout=15,
        ).json()
        pages = resp.get("query", {}).get("pages", {})
        for page in pages.values():
            extract = page.get("extract")
            if extract and len(extract.strip()) >= 50:
                return extract.strip()
        return None
    except (requests.RequestException, ValueError, TypeError):
        return None


def wikipedia_resolver(persona_name: str) -> str:
    """Return the clean plain-text Wikipedia article (no HTML)."""
    return _mediawiki_extract("https://en.wikipedia.org/w/api.php", persona_name) or ""


def wikiquote_resolver(persona_name: str) -> str | None:
    """Return real quotations attributed to the person, as plain text.

    Wikiquote captures the person's actual voice / rhetoric, which is the
    highest-value signal for an in-character debate. Returns None on failure.
    """
    return _mediawiki_extract("https://en.wikiquote.org/w/api.php", persona_name)


def wikidata_resolver(persona_name: str) -> str | None:
    """Build a readable blob of structured facts from Wikidata.

    Resolves the entity, then renders a curated set of properties
    (occupation, citizenship, birth/death, education, awards, etc.) into
    plain text. Returns None on any failure so persona builds never break.
    """
    try:
        # 1. find the entity QID
        search = requests.get(
            "https://www.wikidata.org/w/api.php",
            params={
                "action": "wbsearchentities",
                "search": persona_name,
                "language": "en",
                "format": "json",
                "limit": 1,
            },
            headers=UA,
            timeout=10,
        ).json()
        hits = search.get("search") or []
        if not hits:
            return None
        qid = hits[0]["id"]

        # 2. fetch the entity (labels, description, aliases, claims)
        entity = requests.get(
            "https://www.wikidata.org/w/api.php",
            params={
                "action": "wbgetentities",
                "ids": qid,
                "languages": "en",
                "props": "labels|descriptions|aliases|claims",
                "format": "json",
            },
            headers=UA,
            timeout=10,
        ).json()["entities"][qid]

        label = entity.get("labels", {}).get("en", {}).get("value", persona_name)
        description = entity.get("descriptions", {}).get("en", {}).get("value", "")
        aliases = [a["value"] for a in entity.get("aliases", {}).get("en", [])]
        claims = entity.get("claims", {})

        # collect property values; entity-valued targets are resolved in batch
        wanted: dict[str, list[tuple[str, str]]] = {}
        referenced_qids: set[str] = set()
        for prop in WIKIDATA_PROPERTIES:
            values = []
            for st in claims.get(prop, []):
                dv = st.get("mainsnak", {}).get("datavalue")
                if not dv:
                    continue
                if dv["type"] == "wikibase-entityid":
                    vqid = dv["value"]["id"]
                    referenced_qids.add(vqid)
                    values.append(("qid", vqid))
                elif dv["type"] == "time":
                    values.append(("lit", dv["value"]["time"].lstrip("+").split("T")[0]))
                elif dv["type"] == "string":
                    values.append(("lit", dv["value"]))
            if values:
                wanted[prop] = values

        # batch-resolve referenced QIDs to human labels
        labels_map: dict[str, str] = {}
        ref_list = list(referenced_qids)
        for i in range(0, len(ref_list), 50):
            batch = ref_list[i : i + 50]
            resolved = requests.get(
                "https://www.wikidata.org/w/api.php",
                params={
                    "action": "wbgetentities",
                    "ids": "|".join(batch),
                    "languages": "en",
                    "props": "labels",
                    "format": "json",
                },
                headers=UA,
                timeout=10,
            ).json().get("entities", {})
            for q, e in resolved.items():
                labels_map[q] = e.get("labels", {}).get("en", {}).get("value", q)

        lines = [label + (f" — {description}" if description else "")]
        if aliases:
            lines.append("Also known as: " + ", ".join(aliases))
        for prop, values in wanted.items():
            rendered = [labels_map.get(v, v) if kind == "qid" else v for kind, v in values]
            lines.append(f"{WIKIDATA_PROPERTIES[prop]}: " + ", ".join(rendered))

        text = ". ".join(lines)
        return text if len(text) >= 20 else None

    except (requests.RequestException, KeyError, ValueError, TypeError):
        return None


def dbpedia_resolver(persona_name: str) -> str | None:
    """Fetch English text about the entity from DBpedia.

    Prefers the long ``ontology/abstract``; falls back to the shorter
    ``ontology/description`` when the public endpoint doesn't serve the
    abstract (currently common). Returns None on any failure so persona
    builds never break.
    """
    try:
        resource = persona_name.strip().replace(" ", "_")
        data = requests.get(
            f"https://dbpedia.org/data/{quote(resource)}.json",
            headers=UA,
            timeout=10,
        ).json()

        node = data.get(f"http://dbpedia.org/resource/{resource}")
        if not node:
            return None

        def first_en(predicate: str) -> str | None:
            for entry in node.get(predicate, []):
                if entry.get("lang") == "en" and entry.get("value"):
                    return entry["value"]
            return None

        abstract = first_en("http://dbpedia.org/ontology/abstract")
        if abstract and len(abstract) >= 50:
            return abstract

        description = first_en("http://dbpedia.org/ontology/description")
        if description and len(description) >= 15:
            return description

        return None

    except (requests.RequestException, ValueError, TypeError):
        return None
