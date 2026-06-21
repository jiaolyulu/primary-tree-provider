from __future__ import annotations

from functools import lru_cache
import math
import re
import sqlite3
import unicodedata
from pathlib import Path
from typing import Any, Sequence, TypedDict


BACKEND_ROOT = Path(__file__).resolve().parents[1]
DATABASE_PATH = BACKEND_ROOT / "data" / "provider_index.sqlite"


class Coordinates(TypedDict):
    latitude: float
    longitude: float


def connection() -> sqlite3.Connection:
    database = sqlite3.connect(DATABASE_PATH)
    database.row_factory = sqlite3.Row
    database.execute("PRAGMA query_only = ON")
    return database


@lru_cache(maxsize=1)
def dictionaries() -> dict[str, dict[int, str]]:
    with connection() as database:
        entries = database.execute("SELECT field, value_id, value FROM dictionary_entries").fetchall()

    values: dict[str, dict[int, str]] = {}
    for entry in entries:
        values.setdefault(entry["field"], {})[entry["value_id"]] = entry["value"]
    return values


@lru_cache(maxsize=1)
def dictionary_ids() -> dict[str, dict[str, int]]:
    return {
        field: {value: value_id for value_id, value in values.items()}
        for field, values in dictionaries().items()
    }


@lru_cache(maxsize=1)
def provider_columns() -> set[str]:
    with connection() as database:
        rows = database.execute("PRAGMA table_info(providers)").fetchall()
    return {row["name"] for row in rows}


def storage_column(field: str) -> str:
    columns = provider_columns()
    dictionary_column = f"{field}_id"
    if dictionary_column in columns:
        return dictionary_column
    if field in columns:
        return field
    raise KeyError(f"Provider field not found in SQLite index: {field}")


def has_provider_field(field: str) -> bool:
    columns = provider_columns()
    return field in columns or f"{field}_id" in columns


def uses_dictionary_column(field: str, column: str) -> bool:
    return column.endswith("_id") or field in dictionaries()


def provider_value(row: sqlite3.Row, field: str) -> Any:
    column = storage_column(field)
    if uses_dictionary_column(field, column):
        values = dictionaries().get(field)
        if values is not None and isinstance(row[column], int):
            return values[row[column]]
    return row[column]


def zipcode_label(value: Any) -> str:
    if isinstance(value, int):
        return f"{value:05d}" if value < 10000 else str(value)
    if isinstance(value, float) and value.is_integer():
        integer_value = int(value)
        return f"{integer_value:05d}" if integer_value < 10000 else str(integer_value)
    return str(value)


def provider_network_stats() -> dict[str, int]:
    zip_column = storage_column("clinic_zipcode")
    specialty_column = storage_column("medical_specialty")
    with connection() as database:
        total_providers, zip_count, specialty_count = database.execute(
            f"""
            SELECT
                COUNT(*),
                COUNT(DISTINCT {zip_column}),
                COUNT(DISTINCT {specialty_column})
            FROM providers
            """
        ).fetchone()
    return {
        "totalProviders": total_providers,
        "zipCount": zip_count,
        "specialtyCount": specialty_count,
    }


def zip_distance(left: str, right: str) -> int:
    try:
        return abs(int(left) - int(right))
    except ValueError:
        return 9999


def coordinate_distance_miles(origin: Coordinates, destination: Coordinates) -> float:
    earth_radius_miles = 3958.8
    latitude_delta = math.radians(destination["latitude"] - origin["latitude"])
    longitude_delta = math.radians(destination["longitude"] - origin["longitude"])
    origin_latitude = math.radians(origin["latitude"])
    destination_latitude = math.radians(destination["latitude"])
    haversine = (
        math.sin(latitude_delta / 2) ** 2
        + math.cos(origin_latitude) * math.cos(destination_latitude) * math.sin(longitude_delta / 2) ** 2
    )
    return earth_radius_miles * 2 * math.atan2(math.sqrt(haversine), math.sqrt(1 - haversine))


def rows_for_coordinates(database: sqlite3.Connection, coordinates: Coordinates) -> list[sqlite3.Row]:
    latitude = coordinates["latitude"]
    longitude = coordinates["longitude"]
    latitude_column = storage_column("clinic_latitude") if has_provider_field("clinic_latitude") else storage_column("lat")
    longitude_column = (
        storage_column("clinic_longitude") if has_provider_field("clinic_longitude") else storage_column("lng")
    )
    for radius in [0.01, 0.02, 0.04, 0.08, 0.14]:
        rows = database.execute(
            f"""
            SELECT *
            FROM providers
            WHERE {latitude_column} BETWEEN ? AND ?
              AND {longitude_column} BETWEEN ? AND ?
            ORDER BY (({latitude_column} - ?) * ({latitude_column} - ?))
              + (({longitude_column} - ?) * ({longitude_column} - ?))
            LIMIT 700
            """,
            (
                latitude - radius,
                latitude + radius,
                longitude - radius,
                longitude + radius,
                latitude,
                latitude,
                longitude,
                longitude,
            ),
        ).fetchall()
        if len(rows) >= 120:
            return rows
    return rows


def rows_for_zip(database: sqlite3.Connection, zipcode: str) -> list[sqlite3.Row]:
    zip_column = storage_column("clinic_zipcode")
    if uses_dictionary_column("clinic_zipcode", zip_column):
        zip_id = dictionary_ids().get("clinic_zipcode", {}).get(zipcode)
        if zip_id is not None:
            rows = database.execute(
                f"""
                SELECT *
                FROM providers
                WHERE {zip_column} = ?
                ORDER BY star_doctor DESC, care_rating DESC, care_accessibility_score DESC
                LIMIT 700
                """,
                (zip_id,),
            ).fetchall()
            if rows:
                return rows

        zipcode_values = dictionaries().get("clinic_zipcode", {})
        nearest_zip_ids = [
            value_id
            for value_id, _value in sorted(
                zipcode_values.items(),
                key=lambda item: zip_distance(item[1], zipcode),
            )[:5]
        ]
        placeholders = ", ".join("?" for _ in nearest_zip_ids)
        return database.execute(
            f"""
            SELECT *
            FROM providers
            WHERE {zip_column} IN ({placeholders})
            ORDER BY star_doctor DESC, care_rating DESC, care_accessibility_score DESC
            LIMIT 900
            """,
            nearest_zip_ids,
        ).fetchall()

    try:
        zipcode_number = int(zipcode)
    except ValueError:
        zipcode_number = 0

    rows = database.execute(
        f"""
        SELECT *
        FROM providers
        WHERE {zip_column} = ?
        ORDER BY star_doctor DESC, care_rating DESC, care_accessibility_score DESC
        LIMIT 700
        """,
        (zipcode_number,),
    ).fetchall()
    if rows:
        return rows

    return database.execute(
        f"""
        SELECT *
        FROM providers
        ORDER BY ABS({zip_column} - ?), star_doctor DESC, care_rating DESC, care_accessibility_score DESC
        LIMIT 900
        """,
        (zipcode_number,),
    ).fetchall()


def rows_for_specialty(
    database: sqlite3.Connection,
    specialty: str,
    zipcode: str,
    coordinates: Coordinates | None = None,
) -> list[sqlite3.Row]:
    specialty_column = storage_column("medical_specialty")
    specialty_value: Any
    if uses_dictionary_column("medical_specialty", specialty_column):
        specialty_value = dictionary_ids().get("medical_specialty", {}).get(specialty)
        if specialty_value is None:
            return []
    else:
        specialty_value = specialty

    rows = database.execute(
        f"""
        SELECT *
        FROM providers
        WHERE {specialty_column} = ?
        """,
        (specialty_value,),
    ).fetchall()

    if coordinates:
        latitude_column = (
            storage_column("clinic_latitude") if has_provider_field("clinic_latitude") else storage_column("lat")
        )
        longitude_column = (
            storage_column("clinic_longitude") if has_provider_field("clinic_longitude") else storage_column("lng")
        )
        latitude = coordinates["latitude"]
        longitude = coordinates["longitude"]
        rows.sort(
            key=lambda row: (
                (row[latitude_column] - latitude) * (row[latitude_column] - latitude)
                + (row[longitude_column] - longitude) * (row[longitude_column] - longitude),
                -int(row["star_doctor"]),
                -float(row["care_rating"]),
            )
        )
    else:
        rows.sort(
            key=lambda row: (
                zip_distance(zipcode_label(provider_value(row, "clinic_zipcode")), zipcode),
                -int(provider_value(row, "star_doctor")),
                -float(provider_value(row, "care_rating")),
                -int(provider_value(row, "care_accessibility_score")),
            )
        )

    return rows[:900]


def condition_map(database: sqlite3.Connection, provider_ids: list[int]) -> dict[int, set[str]]:
    if not provider_ids:
        return {}
    placeholders = ", ".join("?" for _ in provider_ids)
    rows = database.execute(
        f"""
        SELECT provider_id, condition_key
        FROM provider_conditions
        WHERE provider_id IN ({placeholders})
        """,
        provider_ids,
    ).fetchall()
    conditions: dict[int, set[str]] = {}
    for row in rows:
        conditions.setdefault(row["provider_id"], set()).add(row["condition_key"])
    return conditions


def decoded(row: sqlite3.Row, field: str) -> str:
    return str(provider_value(row, field))


def split_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def row_to_provider(row: sqlite3.Row) -> dict[str, Any]:
    species_common = decoded(row, "species_common")
    species_scientific = decoded(row, "species_scientific")
    medical_specialty = decoded(row, "medical_specialty")
    provider_type = decoded(row, "provider_type")
    clinic_neighborhood = decoded(row, "clinic_neighborhood")
    clinic_address = decoded(row, "clinic_address")
    searchable_conditions = split_list(decoded(row, "searchable_conditions"))
    primary_care_services = split_list(decoded(row, "primary_care_services"))
    years_of_practice = int(provider_value(row, "years_of_practice"))
    years_at_current_spot = int(provider_value(row, "years_at_current_spot"))
    care_accessibility_score = int(provider_value(row, "care_accessibility_score"))
    storm_response_readiness = decoded(row, "storm_response_readiness")
    clinic_zipcode = zipcode_label(provider_value(row, "clinic_zipcode"))
    clinic_latitude = provider_value(row, "clinic_latitude")
    clinic_longitude = provider_value(row, "clinic_longitude")

    return {
        "providerId": row["provider_id"],
        "speciesCommon": species_common,
        "speciesScientific": species_scientific,
        "medicalSpecialty": medical_specialty,
        "specialtyDescription": decoded(row, "specialty_description"),
        "searchableConditions": searchable_conditions,
        "providerType": provider_type,
        "treeExperienceLevel": decoded(row, "tree_experience_level"),
        "yearsOfPractice": years_of_practice,
        "yearsAtCurrentSpot": years_at_current_spot,
        "careRating": provider_value(row, "care_rating"),
        "reviewCount": int(provider_value(row, "review_count")),
        "starDoctor": bool(provider_value(row, "star_doctor")),
        "popularityBadge": decoded(row, "popularity_badge"),
        "nextAvailableVisitDays": int(provider_value(row, "next_available_visit_days")),
        "weekendAvailability": bool(provider_value(row, "weekend_availability")),
        "stormResponseReadiness": storm_response_readiness,
        "careAccessibilityScore": care_accessibility_score,
        "shadeSideMannerScore": provider_value(row, "shade_side_manner_score"),
        "carePhilosophy": decoded(row, "care_philosophy"),
        "providerBio": decoded(row, "provider_bio"),
        "clinicDescription": decoded(row, "clinic_description"),
        "patientReviewSummary": decoded(row, "patient_review_summary"),
        "careAudience": decoded(row, "care_audience"),
        "primaryCareServices": primary_care_services,
        "signaturePrescription": decoded(row, "signature_prescription"),
        "officeVibe": decoded(row, "office_vibe"),
        "waitingRoomFeature": decoded(row, "waiting_room_feature"),
        "leafPaperworkLevel": decoded(row, "leaf_paperwork_level"),
        "branchOfficeStatus": decoded(row, "branch_office_status"),
        "clinicName": decoded(row, "clinic_name"),
        "clinicAddress": clinic_address,
        "clinicZipcode": clinic_zipcode,
        "clinicCity": decoded(row, "clinic_city"),
        "clinicNeighborhood": clinic_neighborhood,
        "clinicState": decoded(row, "clinic_state"),
        "clinicLatitude": clinic_latitude,
        "clinicLongitude": clinic_longitude,
    }


STREET_TOKEN_ALIASES = {
    "av": "avenue",
    "ave": "avenue",
    "aven": "avenue",
    "blvd": "boulevard",
    "ct": "court",
    "dr": "drive",
    "e": "east",
    "hwy": "highway",
    "ln": "lane",
    "n": "north",
    "pkwy": "parkway",
    "pl": "place",
    "rd": "road",
    "s": "south",
    "st": "street",
    "str": "street",
    "ter": "terrace",
    "w": "west",
}

ORDINAL_TOKEN_ALIASES = {
    "first": "1",
    "second": "2",
    "third": "3",
    "fourth": "4",
    "fifth": "5",
    "sixth": "6",
    "seventh": "7",
    "eighth": "8",
    "ninth": "9",
    "tenth": "10",
    "eleventh": "11",
    "twelfth": "12",
    "thirteenth": "13",
    "fourteenth": "14",
    "fifteenth": "15",
    "sixteenth": "16",
    "seventeenth": "17",
    "eighteenth": "18",
    "nineteenth": "19",
    "twentieth": "20",
}

STREET_SUFFIX_WORDS = {
    "avenue",
    "boulevard",
    "court",
    "drive",
    "highway",
    "lane",
    "parkway",
    "place",
    "road",
    "street",
    "terrace",
}

LOCATION_SEARCH_FIELDS = {"clinic_address", "clinic_neighborhood", "clinic_city"}
HEALTH_INTENT_SEARCH_FIELDS = {"searchable_conditions", "medical_specialty"}


def normalize_search_text(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode("ascii")
    text = text.casefold().replace("&", " and ")
    text = re.sub(r"(?<=\d)(st|nd|rd|th)\b", "", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    tokens = []
    for token in text.split():
        aliased_token = STREET_TOKEN_ALIASES.get(token, token)
        tokens.append(ORDINAL_TOKEN_ALIASES.get(aliased_token, aliased_token))
    return " ".join(tokens)


def compact_search_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value)


BROWSE_HEALTH_SEARCH_INTENTS: list[dict[str, Any]] = [
    {
        "triggers": ["bi polar", "bipolar", "bipolar disorder", "manic depression", "mania", "mood swings"],
        "aliases": ["anxiety", "depression", "Psychiatry"],
    },
    {
        "triggers": ["panic attack", "panic attacks", "panic", "anxiety attack"],
        "aliases": ["anxiety", "Psychiatry"],
    },
    {
        "triggers": ["heart attack", "heart pain", "chest tightness", "chest pressure"],
        "aliases": ["chest pain", "Cardiology"],
    },
    {
        "triggers": ["trouble breathing", "cant breathe", "can't breathe", "breathing problem", "breathlessness"],
        "aliases": ["shortness of breath", "asthma", "Pulmonology"],
    },
    {
        "triggers": ["heartburn", "indigestion", "stomach burning"],
        "aliases": ["acid reflux", "stomach pain", "Gastroenterology"],
    },
    {
        "triggers": ["stomach bug", "tummy ache", "belly pain", "upset stomach"],
        "aliases": ["stomach pain", "IBS", "Gastroenterology"],
    },
    {
        "triggers": ["skin breakout", "breakouts", "itchy rash", "skin rash"],
        "aliases": ["acne", "eczema", "Dermatology"],
    },
    {
        "triggers": ["high blood sugar", "blood sugar", "sugar problem"],
        "aliases": ["diabetes", "Endocrinology"],
    },
    {
        "triggers": ["ear ache", "earache", "stuffy nose", "sinus pressure"],
        "aliases": ["ear pain", "sinus infection", "ENT / Otolaryngology"],
    },
    {
        "triggers": ["uti", "pee burning", "burning urination", "bladder infection"],
        "aliases": ["urinary tract infection", "urinary frequency", "Urology"],
    },
    {
        "triggers": ["period cramps", "period pain", "irregular period", "heavy period"],
        "aliases": ["menstrual concerns", "Women's Health"],
    },
    {
        "triggers": ["sprained ankle", "twisted ankle", "pulled muscle", "sports injury"],
        "aliases": ["sprains", "running injuries", "Sports Medicine"],
    },
]


def query_matches_health_intent(normalized_query: str, compact_query: str, trigger: str) -> bool:
    normalized_trigger = normalize_search_text(trigger)
    compact_trigger = compact_search_text(normalized_trigger)
    if compact_query == compact_trigger:
        return True
    if len(normalized_trigger.split()) > 1 and normalized_trigger in normalized_query:
        return True
    return len(compact_trigger) >= 5 and compact_trigger in compact_query


def health_search_intents_for_query(normalized_query: str, compact_query: str) -> list[dict[str, Any]]:
    intents = []
    for intent in BROWSE_HEALTH_SEARCH_INTENTS:
        if any(query_matches_health_intent(normalized_query, compact_query, trigger) for trigger in intent["triggers"]):
            intents.append(intent)
    return intents


def street_name_from_address(address: str) -> str:
    return re.sub(r"^\s*\d+(?:-\d+)?[a-z]?\s+", "", address, flags=re.IGNORECASE)


def address_number_from_address(address: str) -> int | None:
    match = re.match(r"^\s*(\d+)(?:-\d+)?[a-z]?\b", address, flags=re.IGNORECASE)
    return int(match.group(1)) if match else None


def street_stem_from_normalized(normalized_street: str) -> str:
    tokens = normalized_street.split()
    while tokens and tokens[-1] in STREET_SUFFIX_WORDS:
        tokens.pop()
    return " ".join(tokens)


def parsed_street_query(query: str, normalized_query: str) -> dict[str, Any] | None:
    address_match = re.match(r"^\s*(\d+)(?:-\d+)?[a-z]?\b[\s,.-]*", query, flags=re.IGNORECASE)
    house_number = int(address_match.group(1)) if address_match else None
    street_source = query[address_match.end() :] if address_match else query
    normalized_street_source = normalize_search_text(street_source) if address_match else normalized_query
    tokens = normalized_street_source.split()
    if not tokens:
        return None

    suffix_index = next((index for index, token in enumerate(tokens) if token in STREET_SUFFIX_WORDS), None)
    has_suffix = suffix_index is not None
    street_tokens = tokens[: suffix_index + 1] if has_suffix else tokens
    street_tokens = [token for token in street_tokens if not (token.isdigit() and len(token) == 5)]
    normalized_street = " ".join(street_tokens)
    if not normalized_street:
        return None

    return {
        "houseNumber": house_number,
        "street": normalized_street,
        "streetStem": street_stem_from_normalized(normalized_street),
        "hasSuffix": has_suffix,
    }


BROWSE_SEARCH_VALUE_FIELDS = [
    ("species_common", "Common name", 120, None),
    ("species_scientific", "Scientific name", 120, None),
    ("clinic_zipcode", "ZIP code", 130, None),
    ("searchable_conditions", "Symptom", 118, None),
    ("clinic_address", "Address", 105, None),
    ("clinic_address", "Street", 98, street_name_from_address),
    ("clinic_neighborhood", "Neighborhood", 95, None),
    ("clinic_city", "City", 46, None),
    ("medical_specialty", "Specialty", 34, None),
]

BROWSE_SEARCH_RESULT_FIELDS = [
    "species_common",
    "species_scientific",
    "medical_specialty",
    "searchable_conditions",
    "clinic_address",
    "clinic_zipcode",
    "clinic_city",
    "clinic_neighborhood",
    "clinic_state",
    "clinic_latitude",
    "clinic_longitude",
    "care_rating",
    "review_count",
    "star_doctor",
]


def matched_query_tokens(query_tokens: list[str], field_value: str) -> set[str]:
    field_tokens = field_value.split()
    matched = set()
    for token in query_tokens:
        if token.isdigit():
            if any(field_token == token or (len(token) >= 3 and field_token.startswith(token)) for field_token in field_tokens):
                matched.add(token)
            continue

        if any(field_token.startswith(token) for field_token in field_tokens):
            matched.add(token)
    return matched


def has_street_query_intent(query_tokens: list[str]) -> bool:
    return any(token in STREET_SUFFIX_WORDS for token in query_tokens)


def optimized_search_value_score(
    search_value: dict[str, Any],
    normalized_query: str,
    compact_query: str,
    query_tokens: list[str],
) -> tuple[float, set[str]]:
    field_value = search_value["normalized"]
    compact_value = search_value["compact"]
    weight = search_value["weight"]
    field_score = 0.0
    covered_tokens = matched_query_tokens(query_tokens, field_value)

    if search_value["field"] == "clinic_zipcode":
        zip_tokens = [token for token in query_tokens if token.isdigit() and len(token) >= 3]
        zip_score = 0.0
        zip_coverage: set[str] = set()
        for token in zip_tokens:
            if field_value == token:
                zip_score = max(zip_score, weight + 90)
                zip_coverage.add(token)
            elif field_value.startswith(token):
                zip_score = max(zip_score, weight + 45)
                zip_coverage.add(token)
            elif token in field_value:
                zip_score = max(zip_score, weight + 22)
                zip_coverage.add(token)
        return zip_score, zip_coverage

    if search_value["field"] == "clinic_address" and query_tokens and len(covered_tokens) < len(query_tokens):
        return 0.0, set()

    if field_value == normalized_query:
        field_score = weight + 90
        covered_tokens = set(query_tokens)
    elif field_value.startswith(normalized_query):
        field_score = weight + 45
        covered_tokens = set(query_tokens)
    elif normalized_query in field_value:
        field_score = weight + 22
        covered_tokens = set(query_tokens)
    elif len(compact_query) >= 3 and compact_query in compact_value:
        field_score = weight * 0.72
        covered_tokens = set(query_tokens)
    elif query_tokens and len(covered_tokens) == len(query_tokens):
        field_score = weight * 0.58
    elif query_tokens and covered_tokens:
        field_score = weight * (0.18 + 0.24 * (len(covered_tokens) / len(query_tokens)))

    return field_score, covered_tokens


def chunked(values: list[Any], size: int = 850):
    for index in range(0, len(values), size):
        yield values[index : index + size]


@lru_cache(maxsize=1)
def browse_search_values() -> list[dict[str, Any]]:
    dictionary_values = dictionaries()
    fields = sorted({field for field, _label, _weight, _transform in BROWSE_SEARCH_VALUE_FIELDS})
    columns = {field: storage_column(field) for field in fields}
    raw_values_by_field: dict[str, list[tuple[Any, Any]]] = {}

    with connection() as database:
        for field in fields:
            if field in dictionary_values:
                raw_values_by_field[field] = list(dictionary_values[field].items())
            else:
                column = columns[field]
                rows = database.execute(f"SELECT DISTINCT {column} FROM providers").fetchall()
                raw_values_by_field[field] = [(row[0], row[0]) for row in rows]

    search_values = []
    for field, label, weight, transform in BROWSE_SEARCH_VALUE_FIELDS:
        for raw_value, display_value in raw_values_by_field.get(field, []):
            value = zipcode_label(display_value) if field == "clinic_zipcode" else str(display_value)
            if transform is not None:
                value = transform(value)
            normalized = normalize_search_text(value)
            if not normalized:
                continue
            search_values.append(
                {
                    "field": field,
                    "rawValue": raw_value,
                    "label": label,
                    "weight": weight,
                    "normalized": normalized,
                    "compact": compact_search_text(normalized),
                }
            )

    return search_values


@lru_cache(maxsize=1)
def street_address_value_indexes() -> tuple[dict[str, list[Any]], dict[str, list[Any]]]:
    dictionary_values = dictionaries()
    address_values = dictionary_values.get("clinic_address")

    if address_values is not None:
        raw_address_values = list(address_values.items())
    else:
        address_column = storage_column("clinic_address")
        with connection() as database:
            rows = database.execute(f"SELECT DISTINCT {address_column} FROM providers").fetchall()
        raw_address_values = [(row[0], row[0]) for row in rows]

    exact_index: dict[str, list[Any]] = {}
    stem_index: dict[str, list[Any]] = {}

    for raw_value, display_value in raw_address_values:
        normalized_street = normalize_search_text(street_name_from_address(str(display_value)))
        if not normalized_street:
            continue

        exact_index.setdefault(normalized_street, []).append(raw_value)
        street_stem = street_stem_from_normalized(normalized_street)
        if street_stem and street_stem != normalized_street:
            stem_index.setdefault(street_stem, []).append(raw_value)

    return exact_index, stem_index


def address_values_for_street_query(street_query: dict[str, Any]) -> list[Any]:
    exact_index, stem_index = street_address_value_indexes()
    exact_values = exact_index.get(street_query["street"], [])
    if exact_values:
        return exact_values

    can_use_stem = street_query["houseNumber"] is not None or not street_query["hasSuffix"]
    if not can_use_stem:
        return []

    stem = street_query["streetStem"] or street_query["street"]
    return stem_index.get(stem, [])


def browse_row_value(
    row: sqlite3.Row,
    columns: dict[str, str],
    dictionary_values: dict[str, dict[int, str]],
    field: str,
) -> Any:
    raw_value = row[columns[field]]
    values = dictionary_values.get(field)
    if values is not None and isinstance(raw_value, int):
        return values[raw_value]
    return raw_value


def browse_result_from_row(
    row: sqlite3.Row,
    columns: dict[str, str],
    dictionary_values: dict[str, dict[int, str]],
    match_reasons: list[str],
) -> dict[str, Any]:
    return {
        "providerId": row["provider_id"],
        "speciesCommon": str(browse_row_value(row, columns, dictionary_values, "species_common")),
        "speciesScientific": str(browse_row_value(row, columns, dictionary_values, "species_scientific")),
        "medicalSpecialty": str(browse_row_value(row, columns, dictionary_values, "medical_specialty")),
        "clinicAddress": str(browse_row_value(row, columns, dictionary_values, "clinic_address")),
        "clinicZipcode": zipcode_label(browse_row_value(row, columns, dictionary_values, "clinic_zipcode")),
        "clinicCity": str(browse_row_value(row, columns, dictionary_values, "clinic_city")),
        "clinicNeighborhood": str(browse_row_value(row, columns, dictionary_values, "clinic_neighborhood")),
        "clinicState": str(browse_row_value(row, columns, dictionary_values, "clinic_state")),
        "clinicLatitude": browse_row_value(row, columns, dictionary_values, "clinic_latitude"),
        "clinicLongitude": browse_row_value(row, columns, dictionary_values, "clinic_longitude"),
        "careRating": browse_row_value(row, columns, dictionary_values, "care_rating"),
        "reviewCount": int(browse_row_value(row, columns, dictionary_values, "review_count")),
        "starDoctor": bool(browse_row_value(row, columns, dictionary_values, "star_doctor")),
        "matchReasons": match_reasons,
    }


def nearby_street_browse_payload(
    query: str,
    street_query: dict[str, Any],
    result_limit: int,
    columns: dict[str, str],
    dictionary_values: dict[str, dict[int, str]],
) -> dict[str, Any] | None:
    address_values = address_values_for_street_query(street_query)
    if not address_values:
        return None

    address_column = storage_column("clinic_address")
    selected_columns = ", ".join(dict.fromkeys(columns.values()))
    candidate_rows: dict[int, sqlite3.Row] = {}

    with connection() as database:
        for address_value_chunk in chunked(address_values):
            placeholders = ", ".join("?" for _ in address_value_chunk)
            rows = database.execute(
                f"SELECT provider_id, {selected_columns} FROM providers WHERE {address_column} IN ({placeholders})",
                address_value_chunk,
            ).fetchall()
            for row in rows:
                candidate_rows[row["provider_id"]] = row

    if not candidate_rows:
        return None

    house_number = street_query["houseNumber"]
    match_reasons = ["Nearby address"] if house_number is not None else ["Street"]
    scored_results = []

    for row in candidate_rows.values():
        result = browse_result_from_row(row, columns, dictionary_values, match_reasons)
        row_house_number = address_number_from_address(result["clinicAddress"])
        if house_number is not None and row_house_number is not None:
            number_gap = abs(row_house_number - house_number)
            side_gap = 0 if row_house_number % 2 == house_number % 2 else 1
        else:
            number_gap = 0 if house_number is None else 1_000_000
            side_gap = 0

        scored_results.append(
            (
                number_gap,
                side_gap,
                -int(result["starDoctor"]),
                -float(result["careRating"]),
                -int(result["reviewCount"]),
                result,
            )
        )

    scored_results.sort(key=lambda result: result[:-1])
    return {
        "query": query,
        "totalMatches": len(scored_results),
        "results": [result[-1] for result in scored_results[:result_limit]],
    }


def value_matches_for_query(
    normalized_query: str,
    compact_query: str,
    query_tokens: list[str],
) -> dict[str, dict[Any, list[dict[str, Any]]]]:
    matches_by_field: dict[str, dict[Any, list[dict[str, Any]]]] = {}
    health_intents = health_search_intents_for_query(normalized_query, compact_query)
    search_values = browse_search_values()

    if not health_intents:
        for value in search_values:
            score, covered_tokens = optimized_search_value_score(value, normalized_query, compact_query, query_tokens)
            if score <= 0:
                continue
            matches_by_field.setdefault(value["field"], {}).setdefault(value["rawValue"], []).append(
                {"score": score, "field": value["field"], "label": value["label"], "tokens": covered_tokens}
            )
        return matches_by_field

    intent_coverage = set(query_tokens)
    for intent in health_intents:
        for alias in intent["aliases"]:
            alias_query = normalize_search_text(alias)
            alias_compact = compact_search_text(alias_query)
            alias_tokens = [token for token in alias_query.split() if len(token) > 1 or token.isdigit()]
            for value in search_values:
                if value["field"] not in HEALTH_INTENT_SEARCH_FIELDS:
                    continue
                score, _covered_tokens = optimized_search_value_score(value, alias_query, alias_compact, alias_tokens)
                if score <= 0:
                    continue
                matches_by_field.setdefault(value["field"], {}).setdefault(value["rawValue"], []).append(
                    {
                        "score": score + 75,
                        "field": value["field"],
                        "label": value["label"],
                        "tokens": intent_coverage,
                    }
                )

    return matches_by_field


def candidate_rows_for_matches(
    matches_by_field: dict[str, dict[Any, list[dict[str, Any]]]],
    columns: dict[str, str],
) -> dict[int, sqlite3.Row]:
    selected_columns = ", ".join(dict.fromkeys(columns.values()))
    candidate_rows: dict[int, sqlite3.Row] = {}

    with connection() as database:
        for field, field_matches in matches_by_field.items():
            provider_column = storage_column(field)
            raw_values = list(field_matches.keys())
            for raw_value_chunk in chunked(raw_values):
                placeholders = ", ".join("?" for _ in raw_value_chunk)
                rows = database.execute(
                    f"SELECT provider_id, {selected_columns} FROM providers WHERE {provider_column} IN ({placeholders})",
                    raw_value_chunk,
                ).fetchall()
                for row in rows:
                    candidate_rows[row["provider_id"]] = row

    return candidate_rows


def scored_browse_result(
    row: sqlite3.Row,
    columns: dict[str, str],
    dictionary_values: dict[str, dict[int, str]],
    matches_by_field: dict[str, dict[Any, list[dict[str, Any]]]],
    query_tokens: list[str],
) -> tuple[float, bool, bool, bool, float, int, dict[str, Any]] | None:
    score = 0.0
    covered_tokens: set[str] = set()
    address_covered_tokens: set[str] = set()
    reasons: list[str] = []
    row_matches: list[dict[str, Any]] = []

    for field, field_matches in matches_by_field.items():
        raw_value = row[columns[field]]
        row_matches.extend(field_matches.get(raw_value, []))

    has_full_non_location_match = any(
        query_tokens
        and len(match["tokens"]) == len(query_tokens)
        and match["field"] not in LOCATION_SEARCH_FIELDS
        for match in row_matches
    )

    for match in row_matches:
        is_partial_location_match = (
            query_tokens
            and has_full_non_location_match
            and match["field"] in LOCATION_SEARCH_FIELDS
            and len(match["tokens"]) < len(query_tokens)
        )
        if is_partial_location_match:
            continue

        score += match["score"]
        covered_tokens.update(match["tokens"])
        if match["field"] == "clinic_address":
            address_covered_tokens.update(match["tokens"])
        if match["label"] not in reasons:
            reasons.append(match["label"])

    if score <= 0:
        return None

    has_full_token_coverage = not query_tokens or set(query_tokens).issubset(covered_tokens)
    has_address_token_coverage = not query_tokens or set(query_tokens).issubset(address_covered_tokens)
    if has_full_token_coverage:
        score += 40
    if has_address_token_coverage:
        score += 36

    result = browse_result_from_row(row, columns, dictionary_values, reasons[:4])
    return (
        score,
        has_full_token_coverage,
        has_address_token_coverage,
        result["starDoctor"],
        result["careRating"],
        result["reviewCount"],
        result,
    )


def browse_provider_search(query: str, limit: int = 18) -> dict[str, Any]:
    normalized_query = normalize_search_text(query)
    compact_query = compact_search_text(normalized_query)
    query_tokens = [token for token in normalized_query.split() if len(token) > 1 or token.isdigit()]
    result_limit = min(10000, max(1, limit))

    if len(compact_query) < 2:
        return {"query": query, "totalMatches": 0, "results": []}

    has_street_intent = has_street_query_intent(query_tokens)
    street_address_query = parsed_street_query(query, normalized_query)
    has_street_address_intent = bool(
        street_address_query
        and (street_address_query["houseNumber"] is not None or street_address_query["hasSuffix"])
    )
    columns = {field: storage_column(field) for field in BROWSE_SEARCH_RESULT_FIELDS}
    dictionary_values = dictionaries()
    matches_by_field = value_matches_for_query(normalized_query, compact_query, query_tokens)
    if not matches_by_field:
        if has_street_address_intent and street_address_query is not None:
            nearby_payload = nearby_street_browse_payload(
                query,
                street_address_query,
                result_limit,
                columns,
                dictionary_values,
            )
            if nearby_payload is not None:
                return nearby_payload
        return {"query": query, "totalMatches": 0, "results": []}

    candidate_rows = candidate_rows_for_matches(matches_by_field, columns)
    scored_results = [
        result
        for row in candidate_rows.values()
        if (result := scored_browse_result(row, columns, dictionary_values, matches_by_field, query_tokens)) is not None
    ]

    full_coverage_results = [result for result in scored_results if (result[2] if has_street_intent else result[1])]
    if full_coverage_results:
        scored_results = full_coverage_results
    elif has_street_address_intent and street_address_query is not None:
        nearby_payload = nearby_street_browse_payload(
            query,
            street_address_query,
            result_limit,
            columns,
            dictionary_values,
        )
        if nearby_payload is not None:
            return nearby_payload

    scored_results.sort(key=lambda result: (-result[0], -int(result[3]), -result[4], -result[5]))
    return {
        "query": query,
        "totalMatches": len(scored_results),
        "results": [result[-1] for result in scored_results[:result_limit]],
    }


def all_provider_coords() -> list[tuple[int, float, float, str, str]]:
    """Return (provider_id, lat, lng, zipcode, species_common) for every provider — used by the network map."""
    lat_col = "clinic_latitude" if has_provider_field("clinic_latitude") else "lat"
    lng_col = "clinic_longitude" if has_provider_field("clinic_longitude") else "lng"
    zip_col = storage_column("clinic_zipcode")
    name_col = storage_column("species_common")
    with connection() as database:
        rows = database.execute(
            f"SELECT provider_id, {lat_col}, {lng_col}, {zip_col}, {name_col} FROM providers"
        ).fetchall()
    zip_dict = dictionaries().get("clinic_zipcode", {})
    name_dict = dictionaries().get("species_common", {})
    result = []
    for row in rows:
        raw_zip = row[3]
        zip_str = zip_dict.get(raw_zip, zipcode_label(raw_zip)) if isinstance(raw_zip, int) else zipcode_label(raw_zip)
        raw_name = row[4]
        name_str = name_dict.get(raw_name, str(raw_name)) if isinstance(raw_name, int) else str(raw_name)
        result.append((row[0], row[1], row[2], zip_str, name_str))
    return result


def get_provider_by_id(provider_id: int) -> dict[str, Any] | None:
    id_column = storage_column("provider_id") if has_provider_field("provider_id") else "provider_id"
    with connection() as database:
        rows = database.execute(
            f"SELECT * FROM providers WHERE {id_column} = ? LIMIT 1",
            (provider_id,),
        ).fetchall()
        if not rows:
            return None
        row = rows[0]
        conditions = condition_map(database, [provider_id])

    provider = row_to_provider(row)
    return {
        **provider,
        "conditionMatch": False,
        "distance": 0.0,
        "distanceLabel": "0.00 mi",
        "locationMatchLabel": "your selection",
        "matchScore": 999,
    }


def clean_search_values(value: str | Sequence[str]) -> list[str]:
    values = [value] if isinstance(value, str) else list(value)
    cleaned_values: list[str] = []
    seen: set[str] = set()
    for item in values:
        cleaned = str(item).strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned_values.append(cleaned)
    return cleaned_values


def diversity_key(value: Any) -> str:
    return str(value).strip().lower()


def diversify_tree_results(matches: list[dict[str, Any]], selected_specialties: list[str]) -> list[dict[str, Any]]:
    if len(matches) < 2:
        return matches

    selected_specialty_keys = {value.lower() for value in selected_specialties}
    top_window_size = min(len(matches), 160)
    remaining = list(enumerate(matches[:top_window_size]))
    diversified: list[dict[str, Any]] = []
    species_counts: dict[str, int] = {}
    specialty_counts: dict[str, int] = {}

    while remaining:
        scan_size = min(len(remaining), 36)
        best_position = 0
        best_score = -math.inf

        for position, (base_rank, match) in enumerate(remaining[:scan_size]):
            species_key = diversity_key(match.get("speciesCommon"))
            specialty_key = diversity_key(match.get("medicalSpecialty"))
            species_seen = species_counts.get(species_key, 0)
            specialty_seen = specialty_counts.get(specialty_key, 0)

            adjusted_score = float(match["matchScore"]) - base_rank * 0.04
            adjusted_score += 18 if species_seen == 0 else -9 * species_seen
            if specialty_key in selected_specialty_keys:
                adjusted_score += 8 if specialty_seen == 0 else -3 * specialty_seen
            elif specialty_seen:
                adjusted_score -= specialty_seen
            if match.get("conditionMatch"):
                adjusted_score += 16
            else:
                adjusted_score -= 8

            if adjusted_score > best_score:
                best_score = adjusted_score
                best_position = position

        _, selected = remaining.pop(best_position)
        species_key = diversity_key(selected.get("speciesCommon"))
        specialty_key = diversity_key(selected.get("medicalSpecialty"))
        species_counts[species_key] = species_counts.get(species_key, 0) + 1
        specialty_counts[specialty_key] = specialty_counts.get(specialty_key, 0) + 1
        diversified.append(selected)

    return diversified + matches[top_window_size:]


def rank_providers(
    zipcode: str,
    symptom: str | Sequence[str],
    coordinates: Coordinates | None = None,
    specialty: str | Sequence[str] = "",
) -> list[dict[str, Any]]:
    symptoms = clean_search_values(symptom)
    specialties = clean_search_values(specialty)
    normalized_symptoms = [value.lower() for value in symptoms]
    normalized_specialties = [value.lower() for value in specialties]
    has_symptom = bool(normalized_symptoms)
    has_specialty = bool(normalized_specialties)
    with connection() as database:
        location_rows = rows_for_coordinates(database, coordinates) if coordinates else rows_for_zip(database, zipcode)
        if has_specialty:
            rows_by_id = {row["provider_id"]: row for row in location_rows}
            for selected_specialty in specialties:
                specialty_rows = rows_for_specialty(database, selected_specialty, zipcode, coordinates)
                rows_by_id.update({row["provider_id"]: row for row in specialty_rows})
            rows = list(rows_by_id.values())
        else:
            rows = location_rows
        provider_conditions = condition_map(database, [row["provider_id"] for row in rows])

    matches: list[dict[str, Any]] = []
    for row in rows:
        provider = row_to_provider(row)
        conditions = provider_conditions.get(provider["providerId"], set())
        condition_match_count = sum(1 for selected_symptom in normalized_symptoms if selected_symptom in conditions)
        condition_match = condition_match_count > 0
        provider_specialty = provider["medicalSpecialty"].lower()
        exact_specialty_match = has_specialty and provider_specialty in normalized_specialties
        specialty_match = exact_specialty_match or (
            has_symptom and any(selected_symptom in provider_specialty for selected_symptom in normalized_symptoms)
        )
        if coordinates:
            distance = coordinate_distance_miles(
                coordinates,
                {"latitude": provider["clinicLatitude"], "longitude": provider["clinicLongitude"]},
            )
            proximity_score = max(0, 180 - distance * 24)
            distance_label = f"{distance:.2f} mi"
            location_match_label = (
                "on this block"
                if distance < 0.15
                else "same walking area"
                if distance < 0.5
                else "near your pin"
                if distance < 2
                else "closest available"
            )
        else:
            distance = zip_distance(provider["clinicZipcode"], zipcode)
            proximity_score = max(0, 140 - distance * 2)
            distance_label = f"{distance} ZIP units"
            location_match_label = "same ZIP" if distance == 0 else "nearby ZIP" if distance < 25 else "closest available"

        match_score = (
            min(condition_match_count, 3) * 12
            + (16 if exact_specialty_match else 0)
            + (4 if specialty_match else 0)
            + proximity_score
            + provider["careAccessibilityScore"] * 0.08
            + provider["careRating"]
            - provider["nextAvailableVisitDays"] * 0.25
        )
        matches.append(
            {
                **provider,
                "conditionMatch": condition_match,
                "distance": distance,
                "distanceLabel": distance_label,
                "locationMatchLabel": location_match_label,
                "matchScore": match_score,
            }
        )

    meaningful_location_gap = 0.1 if coordinates else 0
    prioritize_specialty = has_symptom or has_specialty
    ranked_matches = sorted(
        matches,
        key=lambda match: (
            0
            if prioritize_specialty and match["conditionMatch"]
            else 1
            if prioritize_specialty and match["medicalSpecialty"].lower() in normalized_specialties
            else 2,
            math.floor(match["distance"] / meaningful_location_gap) if meaningful_location_gap else match["distance"],
            -match["matchScore"],
        ),
    )

    should_diversify = len(normalized_symptoms) > 1 or len(normalized_specialties) > 1
    if should_diversify:
        return diversify_tree_results(ranked_matches, normalized_specialties)
    return ranked_matches
