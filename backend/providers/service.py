from __future__ import annotations

from functools import lru_cache
import math
import sqlite3
from pathlib import Path
from typing import Any, TypedDict


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


def provider_value(row: sqlite3.Row, field: str) -> Any:
    column = storage_column(field)
    if column.endswith("_id"):
        return dictionaries()[field][row[column]]
    return row[column]


def provider_value_or(row: sqlite3.Row, field: str, fallback: Any) -> Any:
    if has_provider_field(field):
        return provider_value(row, field)
    return fallback


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


def experience_level(years: int) -> str:
    if years >= 32:
        return "Ancient attending"
    if years >= 20:
        return "Seasoned canopy clinician"
    if years >= 8:
        return "Established neighborhood healer"
    return "Newly rooted resident"


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
    if zip_column.endswith("_id"):
        zip_id = dictionary_ids().get("clinic_zipcode", {}).get(zipcode)
        if zip_id is not None:
            rows = database.execute(
                """
                SELECT *
                FROM providers
                WHERE clinic_zipcode_id = ?
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
            WHERE clinic_zipcode_id IN ({placeholders})
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
    years_at_current_spot = int(provider_value_or(row, "years_at_current_spot", max(1, round(years_of_practice * 0.62))))
    care_accessibility_score = int(provider_value(row, "care_accessibility_score"))
    storm_response_readiness = provider_value_or(
        row,
        "storm_response_readiness",
        "High" if care_accessibility_score >= 92 else "Medium" if care_accessibility_score >= 78 else "Standard",
    )
    clinic_zipcode = zipcode_label(provider_value(row, "clinic_zipcode"))
    clinic_latitude = (
        provider_value(row, "clinic_latitude") if has_provider_field("clinic_latitude") else provider_value(row, "lat")
    )
    clinic_longitude = (
        provider_value(row, "clinic_longitude") if has_provider_field("clinic_longitude") else provider_value(row, "lng")
    )

    return {
        "providerId": row["provider_id"],
        "speciesCommon": species_common,
        "speciesScientific": species_scientific,
        "medicalSpecialty": medical_specialty,
        "specialtyDescription": provider_value_or(
            row,
            "specialty_description",
            f"{medical_specialty} is assigned from the {species_common} species profile in the mapped PCT provider dataset.",
        ),
        "searchableConditions": searchable_conditions,
        "providerType": provider_type,
        "treeExperienceLevel": provider_value_or(row, "tree_experience_level", experience_level(years_of_practice)),
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
        "providerBio": provider_value_or(
            row,
            "provider_bio",
            f"At {clinic_address}, this {species_common} uses shade, street rhythm, and species memory to support {medical_specialty.lower()} concerns.",
        ),
        "clinicDescription": provider_value_or(
            row,
            "clinic_description",
            f"Patients find this practice at a documented NYC street-tree location in {clinic_neighborhood}, where the waiting room is sidewalk, canopy, and weather.",
        ),
        "patientReviewSummary": decoded(row, "patient_review_summary"),
        "careAudience": provider_value_or(
            row,
            "care_audience",
            f"People seeking {medical_specialty.lower()} support near {clinic_neighborhood}",
        ),
        "primaryCareServices": primary_care_services,
        "signaturePrescription": decoded(row, "signature_prescription"),
        "officeVibe": provider_value_or(row, "office_vibe", provider_type),
        "waitingRoomFeature": decoded(row, "waiting_room_feature"),
        "leafPaperworkLevel": decoded(row, "leaf_paperwork_level"),
        "branchOfficeStatus": decoded(row, "branch_office_status"),
        "clinicName": decoded(row, "clinic_name"),
        "clinicAddress": clinic_address,
        "clinicZipcode": clinic_zipcode,
        "clinicCity": decoded(row, "clinic_city"),
        "clinicNeighborhood": clinic_neighborhood,
        "clinicState": provider_value_or(row, "clinic_state", "NY"),
        "clinicLatitude": clinic_latitude,
        "clinicLongitude": clinic_longitude,
    }

def rank_providers(zipcode: str, symptom: str, coordinates: Coordinates | None = None) -> list[dict[str, Any]]:
    normalized_symptom = symptom.strip().lower()
    has_symptom = bool(normalized_symptom)
    with connection() as database:
        rows = rows_for_coordinates(database, coordinates) if coordinates else rows_for_zip(database, zipcode)
        provider_conditions = condition_map(database, [row["provider_id"] for row in rows])

    matches: list[dict[str, Any]] = []
    for row in rows:
        provider = row_to_provider(row)
        conditions = provider_conditions.get(provider["providerId"], set())
        condition_match = has_symptom and normalized_symptom in conditions
        specialty_match = has_symptom and normalized_symptom in provider["medicalSpecialty"].lower()
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
            (12 if condition_match else 0)
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
    return sorted(
        matches,
        key=lambda match: (
            math.floor(match["distance"] / meaningful_location_gap) if meaningful_location_gap else match["distance"],
            -match["matchScore"],
        ),
    )
