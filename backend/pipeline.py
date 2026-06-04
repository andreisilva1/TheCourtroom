import json

from bs4 import BeautifulSoup
from fastapi import HTTPException
import requests
import wikipediaapi

wiki = wikipediaapi.Wikipedia(user_agent="ArgumentAI", language="en")


def show_possible_options_of_personas_based_on_a_commom_name_or_description(
    persona_name: str,
):
    response = requests.get(
        f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={persona_name}&format=json",
        headers={"User-Agent": "PersonaBattle/1.0"},
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


def wikipedia_resolver(persona_name: str) -> dict:
    page = requests.get(
        f"https://en.wikipedia.org/wiki/{persona_name}",
        headers={"User-agent": "ArgumentAI"},
    ).text

    references = []

    for ref in BeautifulSoup(page, "html.parser").select("ol.references a.external"):
        href = ref.get("href")
        text = ref.get_text(strip=True)

        if href:
            references.append({"title": text, "url": href})

    if not page:
        raise HTTPException(
            status_code=404, detail="No persona found with provided name."
        )
    return {
        "wiki": page,
        "references": [reference["url"] for reference in references],
    }
