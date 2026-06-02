from __future__ import annotations

from functools import cmp_to_key, lru_cache
import json
import math
from pathlib import Path
from typing import Any, TypedDict


REPO_ROOT = Path(__file__).resolve().parents[2]
INDEX_ROOT = REPO_ROOT / "public" / "provider-index"


class Coordinates(TypedDict):
    latitude: float
    longitude: float


CONDITION_POOLS: dict[str, list[str]] = {
    "Allergy and Immunology": [
        "seasonal allergies",
        "food allergies",
        "hives",
        "asthma triggers",
        "immune concerns",
        "sinus congestion",
        "eczema flares",
    ],
    "Cardiology": [
        "high blood pressure",
        "chest pain",
        "high cholesterol",
        "heart palpitations",
        "shortness of breath",
        "heart disease prevention",
    ],
    "Dermatology": ["acne", "eczema", "psoriasis", "skin rash", "sun damage", "mole checks", "dry skin"],
    "Endocrinology": [
        "diabetes",
        "thyroid disorder",
        "weight changes",
        "prediabetes",
        "hormone imbalance",
        "fatigue",
        "metabolic syndrome",
    ],
    "ENT / Otolaryngology": ["sinus infection", "ear pain", "sore throat", "hearing concerns", "voice changes", "nasal congestion"],
    "Emergency Medicine": [
        "urgent symptoms",
        "minor injuries",
        "sudden pain",
        "fever triage",
        "cuts and scrapes",
        "dizziness",
        "same-day assessment",
    ],
    "Family Medicine": ["annual physical", "cold and flu", "preventive care", "vaccinations", "minor injuries", "routine checkups"],
    "Gastroenterology": ["acid reflux", "IBS", "stomach pain", "constipation", "diarrhea", "bloating", "colon cancer screening"],
    "Geriatrics": ["memory concerns", "fall risk", "medication management", "mobility changes", "chronic disease care", "caregiver planning"],
    "Hematology": ["anemia", "easy bruising", "blood clot history", "low iron", "abnormal blood counts", "fatigue from anemia"],
    "Infectious Disease": ["recurrent infections", "fever evaluation", "travel health", "wound infection", "antibiotic questions"],
    "Internal Medicine": ["chronic disease care", "fatigue", "medication review", "high blood pressure", "high cholesterol", "adult wellness visits"],
    "Nephrology": ["kidney disease", "high blood pressure", "protein in urine", "electrolyte imbalance", "fluid retention", "kidney stone prevention"],
    "Neurology": ["migraine", "memory changes", "headache", "dizziness", "numbness and tingling", "brain fog", "tremor"],
    "Nutrition and Weight Management": [
        "weight changes",
        "cholesterol nutrition",
        "prediabetes nutrition",
        "heart-healthy eating",
        "digestive nutrition",
        "meal planning",
    ],
    "Oncology": ["cancer screening", "lump evaluation", "survivorship care", "family cancer risk", "abnormal imaging follow-up", "unexplained weight loss"],
    "Ophthalmology": ["vision changes", "dry eyes", "eye irritation", "glaucoma screening", "cataract concerns", "red eye"],
    "Orthopedics": ["joint injury", "fracture follow-up", "back pain", "hip pain", "shoulder pain", "arthritis", "mobility problems"],
    "Pain Management": ["chronic pain", "back pain", "neck pain", "nerve pain", "joint pain", "pain flares"],
    "Pediatrics": ["childhood fever", "growth concerns", "school physicals", "routine vaccinations", "seasonal allergies", "ear infections"],
    "Preventive Medicine": ["annual screenings", "vaccination planning", "healthy aging", "risk reduction", "lifestyle counseling", "blood pressure checks"],
    "Psychiatry": ["anxiety", "depression", "insomnia", "stress management", "burnout", "panic symptoms", "mood changes"],
    "Pulmonology": ["asthma", "chronic cough", "shortness of breath", "bronchitis", "COPD", "wheezing", "post-viral breathing symptoms"],
    "Rheumatology": ["joint pain", "arthritis", "autoimmune concerns", "inflammation", "morning stiffness", "gout"],
    "Sleep Medicine": ["insomnia", "sleep apnea", "snoring", "daytime sleepiness", "restless sleep", "fatigue"],
    "Sports Medicine": ["sprains", "running injuries", "knee pain", "shoulder pain", "overuse injuries", "muscle strains"],
    "Urology": ["urinary tract infection", "urinary frequency", "kidney stones", "prostate concerns", "bladder pain", "incontinence"],
    "Vascular Medicine": ["leg swelling", "varicose veins", "poor circulation", "blood clot concerns", "cold feet", "leg pain when walking"],
    "Women's Health": ["well-woman visit", "menstrual concerns", "menopause symptoms", "contraception counseling", "pelvic pain", "breast health"],
}


def provider_network_stats() -> dict[str, int]:
    manifest = load_manifest()
    return {
        "totalProviders": manifest["totalProviders"],
        "zipCount": len(manifest["zipcodes"]),
        "specialtyCount": len(CONDITION_POOLS),
    }


@lru_cache(maxsize=1)
def load_manifest() -> dict[str, Any]:
    return json.loads((INDEX_ROOT / "manifest.json").read_text())


@lru_cache(maxsize=512)
def read_shard(kind: str, key: str) -> list[list[Any]]:
    safe_key = "".join(character for character in key if character == "-" or character == "_" or character.isalnum())
    path = INDEX_ROOT / kind / f"{safe_key}.json"
    if not path.exists():
        return []
    return json.loads(path.read_text())


def stable_hash(value: str) -> int:
    result = 2166136261
    for character in value:
        result ^= ord(character)
        result = (result * 16777619) & 0xFFFFFFFF
    return result


def pick(items: list[Any], seed: str, offset: int = 0) -> Any:
    return items[(stable_hash(f"{seed}:{offset}") + offset) % len(items)]


def title_case(value: str) -> str:
    return " ".join(word[:1].upper() + word[1:] for word in value.split(" "))


def specialty_for(common: str, scientific: str) -> str:
    species = f"{common} {scientific}".lower()
    rules: list[tuple[list[str], str]] = [
        (["ginkgo"], "Neurology"),
        (["hawthorn", "crataegus"], "Cardiology"),
        (["horse chestnut", "aesculus", "buckeye"], "Vascular Medicine"),
        (["red maple", "red oak", "redcedar", "scarlet oak", "crimson king"], "Hematology"),
        (["linden", "tilia"], "Psychiatry"),
        (["hemlock", "tsuga", "douglas-fir", "pseudotsuga", "drooping", "cedar of lebanon"], "Sleep Medicine"),
        (["oak", "quercus", "beech", "fagus", "redwood", "sequoia", "metasequoia"], "Geriatrics"),
        (["honeylocust", "gleditsia", "planetree", "platanus", "london planetree"], "Internal Medicine"),
        (["maple", "acer", "sweetgum", "liquidambar", "blackgum", "nyssa"], "Endocrinology"),
        (["willow", "salix"], "Pain Management"),
        (["ash", "fraxinus", "hornbeam", "carpinus", "ostrya", "ironwood", "parrotia"], "Orthopedics"),
        (["black pine", "pinus nigra"], "Emergency Medicine"),
        (["pine", "pinus", "spruce", "picea", "fir", "abies", "cedar", "juniper", "arborvitae", "cypress", "catalpa"], "Pulmonology"),
        (["river birch"], "Urology"),
        (["zelkova", "elm", "ulmus", "birch", "betula", "paperbark", "sycamore"], "Dermatology"),
        (["magnolia", "tulip", "liriodendron"], "Women's Health"),
        (["cherry", "plum", "prunus", "serviceberry", "dogwood", "cornus", "redbud", "cercis", "silverbell", "snowbell"], "Pediatrics"),
        (["apple", "malus", "hackberry", "celtis", "coffeetree", "gymnocladus"], "Gastroenterology"),
        (["walnut", "juglans", "chestnut", "castanea", "hazelnut", "corylus", "mulberry", "morus", "pear", "pyrus"], "Nutrition and Weight Management"),
        (["sophora", "styphnolobium", "pagoda", "locust", "robinia", "mimosa", "albizia"], "Allergy and Immunology"),
        (["holly", "ilex", "maackia", "katsura", "hardy rubber"], "Preventive Medicine"),
        (["amur cork", "phellodendron", "sassafras", "ailanthus", "tree of heaven"], "Infectious Disease"),
        (["alder", "alnus", "cottonwood", "populus deltoides"], "Nephrology"),
        (["lilac", "syringa", "fringetree", "chionanthus"], "ENT / Otolaryngology"),
        (["empress", "paulownia", "golden rain", "koelreuteria"], "Ophthalmology"),
        (["eucommia", "rubber tree", "yellowwood", "cladrastis"], "Rheumatology"),
        (["smoketree", "cotinus"], "Oncology"),
        (["aspen", "populus tremuloides", "larch", "larix"], "Sports Medicine"),
        (["crepe myrtle", "lagerstroemia", "goldenrain"], "Family Medicine"),
    ]

    for needles, specialty in rules:
        if any(needle in species for needle in needles):
            return specialty
    fallback = list(CONDITION_POOLS.keys())
    return pick(fallback, species)


def experience_level(years: int) -> str:
    if years >= 32:
        return "Ancient attending"
    if years >= 20:
        return "Seasoned canopy clinician"
    if years >= 8:
        return "Established neighborhood healer"
    return "Newly rooted resident"


def grid_key(latitude: float, longitude: float) -> str:
    scale = load_manifest()["cellSizeDegrees"]
    return f"{math.floor(latitude / scale)}_{math.floor(longitude / scale)}"


def nearby_grid_keys(latitude: float, longitude: float, ring: int) -> list[str]:
    manifest = load_manifest()
    scale = manifest["cellSizeDegrees"]
    grid_cells = set(manifest["gridCells"])
    base_latitude = math.floor(latitude / scale)
    base_longitude = math.floor(longitude / scale)
    keys: list[str] = []

    for latitude_offset in range(-ring, ring + 1):
        for longitude_offset in range(-ring, ring + 1):
            if ring > 0 and abs(latitude_offset) != ring and abs(longitude_offset) != ring:
                continue
            key = f"{base_latitude + latitude_offset}_{base_longitude + longitude_offset}"
            if key in grid_cells:
                keys.append(key)
    return keys


def dedupe_rows(rows: list[list[Any]]) -> list[list[Any]]:
    seen: set[int] = set()
    deduped: list[list[Any]] = []
    for row in rows:
        provider_id = row[0]
        if provider_id in seen:
            continue
        seen.add(provider_id)
        deduped.append(row)
    return deduped


def zip_distance(left: str, right: str) -> int:
    try:
        return abs(int(left) - int(right))
    except ValueError:
        return 9999


def rows_for_zip(zipcode: str) -> list[list[Any]]:
    normalized_zipcode = "".join(character for character in zipcode if character.isdigit())
    zipcodes = load_manifest()["zipcodes"]
    if normalized_zipcode in zipcodes:
        return read_shard("zip", normalized_zipcode)

    nearest_zipcodes = sorted(zipcodes, key=lambda candidate: zip_distance(candidate, normalized_zipcode))[:5]
    return dedupe_rows([row for candidate in nearest_zipcodes for row in read_shard("zip", candidate)])


def rows_for_coordinates(zipcode: str, coordinates: Coordinates) -> list[list[Any]]:
    loaded_keys: set[str] = set()
    rows: list[list[Any]] = []

    for ring in range(0, 9):
        keys = [
            key
            for key in nearby_grid_keys(coordinates["latitude"], coordinates["longitude"], ring)
            if key not in loaded_keys
        ]
        loaded_keys.update(keys)
        for key in keys:
            rows.extend(read_shard("grid", key))
        if len(rows) >= 120:
            break

    if len(rows) < 24 and zipcode:
        rows.extend(rows_for_zip(zipcode))

    return dedupe_rows(rows)


def candidate_rows(zipcode: str, coordinates: Coordinates | None) -> list[list[Any]]:
    if coordinates:
        return rows_for_coordinates(zipcode, coordinates)
    return rows_for_zip(zipcode)


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


def build_provider(row: list[Any]) -> dict[str, Any]:
    (
        provider_id,
        species_common,
        species_scientific,
        clinic_address,
        clinic_zipcode,
        clinic_city,
        clinic_neighborhood,
        clinic_latitude,
        clinic_longitude,
        tree_dbh,
        health,
        steward,
        guards,
        sidewalk,
        problems,
    ) = row
    seed = str(provider_id)
    medical_specialty = specialty_for(species_common, species_scientific)
    conditions = CONDITION_POOLS.get(medical_specialty, CONDITION_POOLS["Internal Medicine"])
    searchable_conditions: list[str] = []
    for index in range(min(5, len(conditions))):
        condition = pick(conditions, seed, index)
        if condition not in searchable_conditions:
            searchable_conditions.append(condition)

    years_of_practice = min(45, max(1, round(tree_dbh * 1.7 + (stable_hash(seed) % 7))))
    years_at_current_spot = max(1, round(years_of_practice * 0.62))
    problem_penalty = 0 if problems == "None" else min(0.8, len(problems.split(",")) * 0.18)
    health_boost = 0.35 if health == "Good" else 0.1 if health == "Fair" else -0.25
    star_doctor = stable_hash(f"{seed}:star") % 10 == 0
    care_rating = max(
        2.2,
        min(5, 3.9 + health_boost + (0.35 if star_doctor else 0) - problem_penalty + (stable_hash(f"{seed}:rating") % 9) / 20),
    )
    care_accessibility_score = max(
        35,
        min(100, 92 + (6 if sidewalk == "NoDamage" else -8) + (0 if guards == "None" else 4) - problem_penalty * 14),
    )
    shade_side_manner_score = max(2, min(5, care_rating + (-0.05 if steward == "None" else 0.18)))
    next_available_visit_days = max(
        0,
        min(19, round(8 - (2 if star_doctor else 0) - (care_rating - 4) + (stable_hash(f"{seed}:wait") % 7))),
    )
    weekend_availability = stable_hash(f"{seed}:weekend") % 3 == 0
    storm_response_readiness = "Standard" if problems == "None" else "High" if care_accessibility_score > 85 else "Medium"
    provider_type = (
        pick(["Star tree doctor", "Popular canopy clinician", "Highly rated shade specialist"], seed)
        if star_doctor
        else pick(["Neighborhood care tree", "Friendly curbside generalist", "Community-rooted care tree", "Curbside shade provider"], seed)
    )
    audience = " and ".join(searchable_conditions[:2])

    return {
        "providerId": provider_id,
        "speciesCommon": species_common,
        "speciesScientific": species_scientific,
        "medicalSpecialty": medical_specialty,
        "specialtyDescription": f"{medical_specialty} is assigned from the {species_common} species profile, following PCT's species-to-specialty mapping rules.",
        "searchableConditions": searchable_conditions,
        "providerType": provider_type,
        "treeExperienceLevel": experience_level(years_of_practice),
        "yearsOfPractice": years_of_practice,
        "yearsAtCurrentSpot": years_at_current_spot,
        "careRating": round(care_rating, 1),
        "reviewCount": max(1, round(years_of_practice * 3.4 + (46 if star_doctor else 8) + (stable_hash(f"{seed}:reviews") % 35))),
        "starDoctor": star_doctor,
        "popularityBadge": "Star doctor" if star_doctor else "Neighborhood regular",
        "nextAvailableVisitDays": next_available_visit_days,
        "weekendAvailability": weekend_availability,
        "stormResponseReadiness": storm_response_readiness,
        "careAccessibilityScore": round(care_accessibility_score),
        "shadeSideMannerScore": round(shade_side_manner_score, 1),
        "carePhilosophy": f"Care begins with proximity: this {species_common} turns a real {clinic_neighborhood} sidewalk into a place for {medical_specialty.lower()}-minded attention.",
        "providerBio": f"At {clinic_address}, this {species_common} uses shade, street rhythm, and species memory to support {audience or 'general care'} concerns.",
        "clinicDescription": f"Patients find this practice at a documented NYC street-tree location in {clinic_neighborhood}, where the waiting room is sidewalk, canopy, and weather.",
        "patientReviewSummary": "Visitors describe the care as local, specific, and rooted in the reality of the block rather than a remote provider network.",
        "careAudience": f"People seeking {medical_specialty.lower()} support near {clinic_neighborhood}",
        "primaryCareServices": [f"{title_case(condition)} consult" for condition in searchable_conditions[:4]],
        "signaturePrescription": pick(
            [
                "Start with the nearest shade, then let the block tell you what your body already noticed.",
                "Spend ten minutes under the canopy before deciding whether the symptom is urgent or environmental.",
                "Walk one slower block, record the air, and return to this provider when the street changes.",
                "Hydrate, pause, and let the closest tree become the first part of the care plan.",
            ],
            seed,
        ),
        "officeVibe": pick(["Local, practical, and shade-forward", "Quiet curbside care", "Block-level attention", "Canopy-first and unhurried"], seed),
        "waitingRoomFeature": "A usable sidewalk pause" if sidewalk == "NoDamage" else "A real sidewalk with some urban friction",
        "leafPaperworkLevel": "Light intake" if problems == "None" else "Moderate environmental notes",
        "branchOfficeStatus": "Wide canopy practice" if tree_dbh > 22 else "Single-tree curbside practice",
        "clinicName": f"{clinic_neighborhood} {species_common} {medical_specialty}",
        "clinicAddress": clinic_address,
        "clinicZipcode": clinic_zipcode,
        "clinicCity": clinic_city,
        "clinicNeighborhood": clinic_neighborhood,
        "clinicState": "NY",
        "clinicLatitude": clinic_latitude,
        "clinicLongitude": clinic_longitude,
    }


def rank_providers(zipcode: str, symptom: str, coordinates: Coordinates | None = None) -> list[dict[str, Any]]:
    normalized_symptom = symptom.strip().lower()
    has_symptom = bool(normalized_symptom)
    rows = candidate_rows(zipcode, coordinates)
    matches: list[dict[str, Any]] = []

    for provider in [build_provider(row) for row in rows]:
        condition_match = has_symptom and any(
            normalized_symptom in condition.lower() for condition in provider["searchableConditions"]
        )
        specialty_match = has_symptom and normalized_symptom in provider["medicalSpecialty"].lower()
        if coordinates:
            distance = coordinate_distance_miles(
                coordinates,
                {"latitude": provider["clinicLatitude"], "longitude": provider["clinicLongitude"]},
            )
        else:
            distance = zip_distance(provider["clinicZipcode"], zipcode)

        proximity_score = max(0, 180 - distance * 24) if coordinates else max(0, 140 - distance * 2)
        match_score = (
            (12 if condition_match else 0)
            + (4 if specialty_match else 0)
            + proximity_score
            + provider["careAccessibilityScore"] * 0.08
            + provider["careRating"]
            - provider["nextAvailableVisitDays"] * 0.25
        )
        if coordinates:
            location_match_label = (
                "on this block"
                if distance < 0.15
                else "same walking area"
                if distance < 0.5
                else "near your pin"
                if distance < 2
                else "closest available"
            )
            distance_label = f"{distance:.2f} mi"
        else:
            location_match_label = "same ZIP" if distance == 0 else "nearby ZIP" if distance < 25 else "closest available"
            distance_label = f"{distance} ZIP units"

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
    def compare(left: dict[str, Any], right: dict[str, Any]) -> int:
        location_difference = left["distance"] - right["distance"]
        if abs(location_difference) > meaningful_location_gap:
            return -1 if location_difference < 0 else 1
        score_difference = right["matchScore"] - left["matchScore"]
        if score_difference == 0:
            return 0
        return -1 if score_difference < 0 else 1

    return sorted(matches, key=cmp_to_key(compare))
