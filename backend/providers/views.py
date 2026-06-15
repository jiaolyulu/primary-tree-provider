from __future__ import annotations

from django.http import HttpRequest, HttpResponse, JsonResponse

from providers.service import all_provider_coords, get_provider_by_id, provider_network_stats, rank_providers


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


def provider_search(request: HttpRequest) -> HttpResponse:
    if request.method == "OPTIONS":
        return with_public_api_headers(HttpResponse(status=204))

    zipcode = request.GET.get("zip", "11215")
    symptom = request.GET.get("symptom", "")
    try:
        limit = min(300, max(5, int(request.GET.get("limit", "200"))))
    except ValueError:
        limit = 200
    lat = request.GET.get("lat")
    lng = request.GET.get("lng")
    coordinates = None

    if lat and lng:
        try:
            coordinates = {"latitude": float(lat), "longitude": float(lng)}
        except ValueError:
            return with_public_api_headers(JsonResponse({"error": "lat and lng must be numeric"}, status=400))

    providers = rank_providers(zipcode, symptom, coordinates)[:limit]
    payload = {
        "providers": providers,
        "stats": provider_network_stats(),
        "query": {
            "zip": zipcode,
            "symptom": symptom,
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


def provider_detail(request: HttpRequest, provider_id: int) -> HttpResponse:
    if request.method == "OPTIONS":
        return with_public_api_headers(HttpResponse(status=204))
    provider = get_provider_by_id(provider_id)
    if provider is None:
        return with_public_api_headers(JsonResponse({"error": "Provider not found"}, status=404))
    return with_public_api_headers(JsonResponse({"provider": provider}))
