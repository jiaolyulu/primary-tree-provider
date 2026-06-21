from __future__ import annotations

from django.http import HttpRequest, HttpResponse, JsonResponse

from providers.service import (
    all_provider_coords,
    browse_provider_search,
    get_provider_by_id,
    provider_network_stats,
    rank_providers,
)


def with_public_api_headers(response: HttpResponse) -> HttpResponse:
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    response["Cache-Control"] = "public, max-age=300, s-maxage=3600"
    return response


def status(request: HttpRequest) -> HttpResponse:
    if request.method == "OPTIONS":
        return with_public_api_headers(HttpResponse(status=204))
    return with_public_api_headers(JsonResponse({"ok": True, "service": "primary-care-trees-django"}))


def clean_query_values(values: list[str]) -> list[str]:
    cleaned_values: list[str] = []
    seen: set[str] = set()
    for value in values:
        cleaned = value.strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned_values.append(cleaned)
    return cleaned_values


def query_label(values: list[str]) -> str:
    if len(values) <= 1:
        return values[0] if values else ""
    return ", ".join(values)


def provider_search(request: HttpRequest) -> HttpResponse:
    if request.method == "OPTIONS":
        return with_public_api_headers(HttpResponse(status=204))

    zipcode = request.GET.get("zip", "11215")
    symptoms = clean_query_values(request.GET.getlist("symptom"))
    specialties = clean_query_values(request.GET.getlist("specialty"))
    symptom = query_label(symptoms)
    specialty = query_label(specialties)
    try:
        limit = min(300, max(5, int(request.GET.get("limit", "50"))))
    except ValueError:
        limit = 50
    lat = request.GET.get("lat")
    lng = request.GET.get("lng")
    coordinates = None

    if lat and lng:
        try:
            coordinates = {"latitude": float(lat), "longitude": float(lng)}
        except ValueError:
            return with_public_api_headers(JsonResponse({"error": "lat and lng must be numeric"}, status=400))

    providers = rank_providers(zipcode, symptoms, coordinates, specialties)[:limit]
    payload = {
        "providers": providers,
        "stats": provider_network_stats(),
        "query": {
            "zip": zipcode,
            "symptom": symptom,
            "specialty": specialty,
            "symptoms": symptoms,
            "specialties": specialties,
            "location": "pin" if coordinates else "zip",
        },
    }
    return with_public_api_headers(JsonResponse(payload))


def provider_coords(request: HttpRequest) -> HttpResponse:
    """Compact [id, lat, lng, zip] list for every provider — powers the network map."""
    if request.method == "OPTIONS":
        return with_public_api_headers(HttpResponse(status=204))
    coords = all_provider_coords()
    return with_public_api_headers(JsonResponse({"coords": coords}))


def provider_browse_search(request: HttpRequest) -> HttpResponse:
    if request.method == "OPTIONS":
        return with_public_api_headers(HttpResponse(status=204))

    query = request.GET.get("q", "")
    try:
        limit = int(request.GET.get("limit", "18"))
    except ValueError:
        limit = 18

    return with_public_api_headers(JsonResponse(browse_provider_search(query, limit)))


def provider_detail(request: HttpRequest, provider_id: int) -> HttpResponse:
    if request.method == "OPTIONS":
        return with_public_api_headers(HttpResponse(status=204))
    provider = get_provider_by_id(provider_id)
    if provider is None:
        return with_public_api_headers(JsonResponse({"error": "Provider not found"}, status=404))
    return with_public_api_headers(JsonResponse({"provider": provider}))
