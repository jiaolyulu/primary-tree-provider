import manifest from "@/lib/provider-index-manifest.json";

export type TreeProviderRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  number,
  number,
  number,
  string,
  string,
  string,
  string,
  string,
];

export type Provider = {
  providerId: number;
  speciesCommon: string;
  speciesScientific: string;
  medicalSpecialty: string;
  specialtyDescription: string;
  searchableConditions: string[];
  providerType: string;
  treeExperienceLevel: string;
  yearsOfPractice: number;
  yearsAtCurrentSpot: number;
  careRating: number;
  reviewCount: number;
  starDoctor: boolean;
  popularityBadge: string;
  nextAvailableVisitDays: number;
  weekendAvailability: boolean;
  stormResponseReadiness: "Standard" | "Medium" | "High";
  careAccessibilityScore: number;
  shadeSideMannerScore: number;
  carePhilosophy: string;
  providerBio: string;
  clinicDescription: string;
  patientReviewSummary: string;
  careAudience: string;
  primaryCareServices: string[];
  signaturePrescription: string;
  officeVibe: string;
  waitingRoomFeature: string;
  leafPaperworkLevel: string;
  branchOfficeStatus: string;
  clinicName: string;
  clinicAddress: string;
  clinicZipcode: string;
  clinicCity: string;
  clinicNeighborhood: string;
  clinicState: "NY";
  clinicLatitude: number;
  clinicLongitude: number;
};

export type ProviderMatch = Provider & {
  conditionMatch: boolean;
  distance: number;
  distanceLabel: string;
  locationMatchLabel: string;
  matchScore: number;
};

const gridCells = new Set<string>(manifest.gridCells);
const zipcodes = manifest.zipcodes;
const shardCache = new Map<string, Promise<TreeProviderRow[]>>();

const conditionPools: Record<string, string[]> = {
  "Allergy and Immunology": ["seasonal allergies", "food allergies", "hives", "asthma triggers", "immune concerns", "sinus congestion", "eczema flares"],
  Cardiology: ["high blood pressure", "chest pain", "high cholesterol", "heart palpitations", "shortness of breath", "heart disease prevention"],
  Dermatology: ["acne", "eczema", "psoriasis", "skin rash", "sun damage", "mole checks", "dry skin"],
  Endocrinology: ["diabetes", "thyroid disorder", "weight changes", "prediabetes", "hormone imbalance", "fatigue", "metabolic syndrome"],
  "ENT / Otolaryngology": ["sinus infection", "ear pain", "sore throat", "hearing concerns", "voice changes", "nasal congestion"],
  "Emergency Medicine": ["urgent symptoms", "minor injuries", "sudden pain", "fever triage", "cuts and scrapes", "dizziness", "same-day assessment"],
  "Family Medicine": ["annual physical", "cold and flu", "preventive care", "vaccinations", "minor injuries", "routine checkups"],
  Gastroenterology: ["acid reflux", "IBS", "stomach pain", "constipation", "diarrhea", "bloating", "colon cancer screening"],
  Geriatrics: ["memory concerns", "fall risk", "medication management", "mobility changes", "chronic disease care", "caregiver planning"],
  Hematology: ["anemia", "easy bruising", "blood clot history", "low iron", "abnormal blood counts", "fatigue from anemia"],
  "Infectious Disease": ["recurrent infections", "fever evaluation", "travel health", "wound infection", "antibiotic questions"],
  "Internal Medicine": ["chronic disease care", "fatigue", "medication review", "high blood pressure", "high cholesterol", "adult wellness visits"],
  Nephrology: ["kidney disease", "high blood pressure", "protein in urine", "electrolyte imbalance", "fluid retention", "kidney stone prevention"],
  Neurology: ["migraine", "memory changes", "headache", "dizziness", "numbness and tingling", "brain fog", "tremor"],
  "Nutrition and Weight Management": ["weight changes", "cholesterol nutrition", "prediabetes nutrition", "heart-healthy eating", "digestive nutrition", "meal planning"],
  Oncology: ["cancer screening", "lump evaluation", "survivorship care", "family cancer risk", "abnormal imaging follow-up", "unexplained weight loss"],
  Ophthalmology: ["vision changes", "dry eyes", "eye irritation", "glaucoma screening", "cataract concerns", "red eye"],
  Orthopedics: ["joint injury", "fracture follow-up", "back pain", "hip pain", "shoulder pain", "arthritis", "mobility problems"],
  "Pain Management": ["chronic pain", "back pain", "neck pain", "nerve pain", "joint pain", "pain flares"],
  Pediatrics: ["childhood fever", "growth concerns", "school physicals", "routine vaccinations", "seasonal allergies", "ear infections"],
  "Preventive Medicine": ["annual screenings", "vaccination planning", "healthy aging", "risk reduction", "lifestyle counseling", "blood pressure checks"],
  Psychiatry: ["anxiety", "depression", "insomnia", "stress management", "burnout", "panic symptoms", "mood changes"],
  Pulmonology: ["asthma", "chronic cough", "shortness of breath", "bronchitis", "COPD", "wheezing", "post-viral breathing symptoms"],
  Rheumatology: ["joint pain", "arthritis", "autoimmune concerns", "inflammation", "morning stiffness", "gout"],
  "Sleep Medicine": ["insomnia", "sleep apnea", "snoring", "daytime sleepiness", "restless sleep", "fatigue"],
  "Sports Medicine": ["sprains", "running injuries", "knee pain", "shoulder pain", "overuse injuries", "muscle strains"],
  Urology: ["urinary tract infection", "urinary frequency", "kidney stones", "prostate concerns", "bladder pain", "incontinence"],
  "Vascular Medicine": ["leg swelling", "varicose veins", "poor circulation", "blood clot concerns", "cold feet", "leg pain when walking"],
  "Women's Health": ["well-woman visit", "menstrual concerns", "menopause symptoms", "contraception counseling", "pelvic pain", "breast health"],
};

export const providerNetworkStats = {
  totalProviders: manifest.totalProviders,
  zipCount: manifest.zipcodes.length,
  specialtyCount: Object.keys(conditionPools).length,
};

const specialtyFallbacks = Object.keys(conditionPools);

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function pick<T>(items: T[], seed: string, offset = 0) {
  return items[(hash(`${seed}:${offset}`) + offset) % items.length];
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function specialtyFor(common: string, scientific: string) {
  const species = `${common} ${scientific}`.toLowerCase();
  const rules: Array<[string[], string]> = [
    [["ginkgo"], "Neurology"],
    [["hawthorn", "crataegus"], "Cardiology"],
    [["horse chestnut", "aesculus", "buckeye"], "Vascular Medicine"],
    [["red maple", "red oak", "redcedar", "scarlet oak", "crimson king"], "Hematology"],
    [["linden", "tilia"], "Psychiatry"],
    [["hemlock", "tsuga", "douglas-fir", "pseudotsuga", "drooping", "cedar of lebanon"], "Sleep Medicine"],
    [["oak", "quercus", "beech", "fagus", "redwood", "sequoia", "metasequoia"], "Geriatrics"],
    [["honeylocust", "gleditsia", "planetree", "platanus", "london planetree"], "Internal Medicine"],
    [["maple", "acer", "sweetgum", "liquidambar", "blackgum", "nyssa"], "Endocrinology"],
    [["willow", "salix"], "Pain Management"],
    [["ash", "fraxinus", "hornbeam", "carpinus", "ostrya", "ironwood", "parrotia"], "Orthopedics"],
    [["black pine", "pinus nigra"], "Emergency Medicine"],
    [["pine", "pinus", "spruce", "picea", "fir", "abies", "cedar", "juniper", "arborvitae", "cypress", "catalpa"], "Pulmonology"],
    [["river birch"], "Urology"],
    [["zelkova", "elm", "ulmus", "birch", "betula", "paperbark", "sycamore"], "Dermatology"],
    [["magnolia", "tulip", "liriodendron"], "Women's Health"],
    [["cherry", "plum", "prunus", "serviceberry", "dogwood", "cornus", "redbud", "cercis", "silverbell", "snowbell"], "Pediatrics"],
    [["apple", "malus", "hackberry", "celtis", "coffeetree", "gymnocladus"], "Gastroenterology"],
    [["walnut", "juglans", "chestnut", "castanea", "hazelnut", "corylus", "mulberry", "morus", "pear", "pyrus"], "Nutrition and Weight Management"],
    [["sophora", "styphnolobium", "pagoda", "locust", "robinia", "mimosa", "albizia"], "Allergy and Immunology"],
    [["holly", "ilex", "maackia", "katsura", "hardy rubber"], "Preventive Medicine"],
    [["amur cork", "phellodendron", "sassafras", "ailanthus", "tree of heaven"], "Infectious Disease"],
    [["alder", "alnus", "cottonwood", "populus deltoides"], "Nephrology"],
    [["lilac", "syringa", "fringetree", "chionanthus"], "ENT / Otolaryngology"],
    [["empress", "paulownia", "golden rain", "koelreuteria"], "Ophthalmology"],
    [["eucommia", "rubber tree", "yellowwood", "cladrastis"], "Rheumatology"],
    [["smoketree", "cotinus"], "Oncology"],
    [["aspen", "populus tremuloides", "larch", "larix"], "Sports Medicine"],
    [["crepe myrtle", "lagerstroemia", "goldenrain"], "Family Medicine"],
  ];

  return rules.find(([needles]) => needles.some((needle) => species.includes(needle)))?.[1] || pick(specialtyFallbacks, species);
}

function experienceLevel(years: number) {
  if (years >= 32) return "Ancient attending";
  if (years >= 20) return "Seasoned canopy clinician";
  if (years >= 8) return "Established neighborhood healer";
  return "Newly rooted resident";
}

function safeShardKey(value: string) {
  return value.replace(/[^-\w]/g, "");
}

async function readShard(kind: "grid" | "zip", key: string) {
  const safeKey = safeShardKey(key);
  const cacheKey = `${kind}/${safeKey}`;
  const existing = shardCache.get(cacheKey);
  if (existing) return existing;

  const pending = fetch(`/provider-index/${kind}/${safeKey}.json`, { cache: "force-cache" })
    .then((response) => (response.ok ? response.json() : []))
    .then((rows) => rows as TreeProviderRow[])
    .catch(() => []);
  shardCache.set(cacheKey, pending);
  return pending;
}

function dedupeRows(rows: TreeProviderRow[]) {
  const seen = new Set<number>();
  const deduped: TreeProviderRow[] = [];
  for (const row of rows) {
    if (seen.has(row[0])) continue;
    seen.add(row[0]);
    deduped.push(row);
  }
  return deduped;
}

function gridKey(latitude: number, longitude: number) {
  const scale = manifest.cellSizeDegrees;
  return `${Math.floor(latitude / scale)}_${Math.floor(longitude / scale)}`;
}

function nearbyGridKeys(latitude: number, longitude: number, ring: number) {
  const scale = manifest.cellSizeDegrees;
  const baseLatitude = Math.floor(latitude / scale);
  const baseLongitude = Math.floor(longitude / scale);
  const keys: string[] = [];

  for (let latitudeOffset = -ring; latitudeOffset <= ring; latitudeOffset += 1) {
    for (let longitudeOffset = -ring; longitudeOffset <= ring; longitudeOffset += 1) {
      if (ring > 0 && Math.abs(latitudeOffset) !== ring && Math.abs(longitudeOffset) !== ring) continue;
      const key = `${baseLatitude + latitudeOffset}_${baseLongitude + longitudeOffset}`;
      if (gridCells.has(key)) keys.push(key);
    }
  }

  return keys;
}

async function rowsForZip(zipcode: string) {
  const normalizedZipcode = safeShardKey(zipcode);
  if (zipcodes.includes(normalizedZipcode)) {
    return readShard("zip", normalizedZipcode);
  }

  const nearestZipcodes = zipcodes
    .map((candidate) => ({ candidate, distance: zipDistance(candidate, normalizedZipcode) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map(({ candidate }) => candidate);
  return dedupeRows((await Promise.all(nearestZipcodes.map((candidate) => readShard("zip", candidate)))).flat());
}

async function rowsForCoordinates(
  zipcode: string,
  coordinates: { latitude: number; longitude: number },
) {
  const loadedKeys = new Set<string>();
  const rows: TreeProviderRow[] = [];

  for (let ring = 0; ring <= 8; ring += 1) {
    const keys = nearbyGridKeys(coordinates.latitude, coordinates.longitude, ring).filter((key) => !loadedKeys.has(key));
    keys.forEach((key) => loadedKeys.add(key));
    rows.push(...(await Promise.all(keys.map((key) => readShard("grid", key)))).flat());
    if (rows.length >= 120) break;
  }

  if (rows.length < 24 && zipcode) {
    rows.push(...(await rowsForZip(zipcode)));
  }

  return dedupeRows(rows);
}

async function candidateRows(
  zipcode: string,
  coordinates?: { latitude: number; longitude: number },
) {
  if (coordinates) return rowsForCoordinates(zipcode, coordinates);
  return rowsForZip(zipcode);
}

async function rankProvidersFromApi(
  zipcode: string,
  symptom: string,
  coordinates?: { latitude: number; longitude: number },
) {
  const configuredApiBaseUrl = process.env.NEXT_PUBLIC_PROVIDER_API_BASE_URL?.replace(/\/$/, "");
  const apiBaseUrl =
    configuredApiBaseUrl?.startsWith("/") && typeof window !== "undefined"
      ? `${window.location.origin}${configuredApiBaseUrl}`
      : configuredApiBaseUrl;
  if (!apiBaseUrl) return null;

  try {
    const url = new URL("/api/providers/search", apiBaseUrl);
    url.searchParams.set("zip", zipcode);
    if (symptom.trim()) url.searchParams.set("symptom", symptom.trim());
    if (coordinates) {
      url.searchParams.set("lat", coordinates.latitude.toFixed(5));
      url.searchParams.set("lng", coordinates.longitude.toFixed(5));
    }

    const response = await fetch(url.toString(), { cache: "force-cache" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { providers?: ProviderMatch[] };
    return Array.isArray(payload.providers) ? payload.providers : null;
  } catch {
    return null;
  }
}

function buildProvider(row: TreeProviderRow): Provider {
  const [providerId, speciesCommon, speciesScientific, clinicAddress, clinicZipcode, clinicCity, clinicNeighborhood, clinicLatitude, clinicLongitude, treeDbh, health, steward, guards, sidewalk, problems] = row;
  const seed = String(providerId);
  const medicalSpecialty = specialtyFor(speciesCommon, speciesScientific);
  const conditions = conditionPools[medicalSpecialty] || conditionPools["Internal Medicine"];
  const searchableConditions = Array.from({ length: Math.min(5, conditions.length) }, (_, index) => pick(conditions, seed, index)).filter(
    (condition, index, list) => list.indexOf(condition) === index,
  );
  const yearsOfPractice = Math.min(45, Math.max(1, Math.round(treeDbh * 1.7 + (hash(seed) % 7))));
  const yearsAtCurrentSpot = Math.max(1, Math.round(yearsOfPractice * 0.62));
  const problemPenalty = problems === "None" ? 0 : Math.min(0.8, problems.split(",").length * 0.18);
  const healthBoost = health === "Good" ? 0.35 : health === "Fair" ? 0.1 : -0.25;
  const starDoctor = hash(`${seed}:star`) % 10 === 0;
  const careRating = Math.max(2.2, Math.min(5, 3.9 + healthBoost + (starDoctor ? 0.35 : 0) - problemPenalty + (hash(`${seed}:rating`) % 9) / 20));
  const careAccessibilityScore = Math.max(35, Math.min(100, 92 + (sidewalk === "NoDamage" ? 6 : -8) + (guards === "None" ? 0 : 4) - problemPenalty * 14));
  const shadeSideMannerScore = Math.max(2, Math.min(5, careRating + (steward === "None" ? -0.05 : 0.18)));
  const nextAvailableVisitDays = Math.max(0, Math.min(19, Math.round(8 - (starDoctor ? 2 : 0) - (careRating - 4) + (hash(`${seed}:wait`) % 7))));
  const weekendAvailability = hash(`${seed}:weekend`) % 3 === 0;
  const stormResponseReadiness = problems === "None" ? "Standard" : careAccessibilityScore > 85 ? "High" : "Medium";
  const providerType = starDoctor
    ? pick(["Star tree doctor", "Popular canopy clinician", "Highly rated shade specialist"], seed)
    : pick(["Neighborhood care tree", "Friendly curbside generalist", "Community-rooted care tree", "Curbside shade provider"], seed);
  const audience = searchableConditions.slice(0, 2).join(" and ");

  return {
    providerId,
    speciesCommon,
    speciesScientific,
    medicalSpecialty,
    specialtyDescription: `${medicalSpecialty} is assigned from the ${speciesCommon} species profile, following PCT's species-to-specialty mapping rules.`,
    searchableConditions,
    providerType,
    treeExperienceLevel: experienceLevel(yearsOfPractice),
    yearsOfPractice,
    yearsAtCurrentSpot,
    careRating: Number(careRating.toFixed(1)),
    reviewCount: Math.max(1, Math.round(yearsOfPractice * 3.4 + (starDoctor ? 46 : 8) + (hash(`${seed}:reviews`) % 35))),
    starDoctor,
    popularityBadge: starDoctor ? "Star doctor" : "Neighborhood regular",
    nextAvailableVisitDays,
    weekendAvailability,
    stormResponseReadiness,
    careAccessibilityScore: Math.round(careAccessibilityScore),
    shadeSideMannerScore: Number(shadeSideMannerScore.toFixed(1)),
    carePhilosophy: `Care begins with proximity: this ${speciesCommon} turns a real ${clinicNeighborhood} sidewalk into a place for ${medicalSpecialty.toLowerCase()}-minded attention.`,
    providerBio: `At ${clinicAddress}, this ${speciesCommon} uses shade, street rhythm, and species memory to support ${audience || "general care"} concerns.`,
    clinicDescription: `Patients find this practice at a documented NYC street-tree location in ${clinicNeighborhood}, where the waiting room is sidewalk, canopy, and weather.`,
    patientReviewSummary: `Visitors describe the care as local, specific, and rooted in the reality of the block rather than a remote provider network.`,
    careAudience: `People seeking ${medicalSpecialty.toLowerCase()} support near ${clinicNeighborhood}`,
    primaryCareServices: searchableConditions.slice(0, 4).map((condition) => `${titleCase(condition)} consult`),
    signaturePrescription: pick(
      [
        "Start with the nearest shade, then let the block tell you what your body already noticed.",
        "Spend ten minutes under the canopy before deciding whether the symptom is urgent or environmental.",
        "Walk one slower block, record the air, and return to this provider when the street changes.",
        "Hydrate, pause, and let the closest tree become the first part of the care plan.",
      ],
      seed,
    ),
    officeVibe: pick(["Local, practical, and shade-forward", "Quiet curbside care", "Block-level attention", "Canopy-first and unhurried"], seed),
    waitingRoomFeature: sidewalk === "NoDamage" ? "A usable sidewalk pause" : "A real sidewalk with some urban friction",
    leafPaperworkLevel: problems === "None" ? "Light intake" : "Moderate environmental notes",
    branchOfficeStatus: treeDbh > 22 ? "Wide canopy practice" : "Single-tree curbside practice",
    clinicName: `${clinicNeighborhood} ${speciesCommon} ${medicalSpecialty}`,
    clinicAddress,
    clinicZipcode,
    clinicCity,
    clinicNeighborhood,
    clinicState: "NY",
    clinicLatitude,
    clinicLongitude,
  };
}

export function zipDistance(a: string, b: string) {
  const left = Number(a);
  const right = Number(b);
  if (Number.isNaN(left) || Number.isNaN(right)) return 9999;
  return Math.abs(left - right);
}

export function coordinateDistanceMiles(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  const earthRadiusMiles = 3958.8;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export async function rankProviders(
  zipcode: string,
  symptom: string,
  coordinates?: { latitude: number; longitude: number },
): Promise<ProviderMatch[]> {
  const apiMatches = await rankProvidersFromApi(zipcode, symptom, coordinates);
  if (apiMatches?.length) return apiMatches;

  const normalizedSymptom = symptom.trim().toLowerCase();
  const hasSymptom = normalizedSymptom.length > 0;
  const rows = await candidateRows(zipcode, coordinates);

  return rows
    .map(buildProvider)
    .map((provider) => {
      const conditionMatch =
        hasSymptom &&
        provider.searchableConditions.some((condition) => condition.toLowerCase().includes(normalizedSymptom));
      const specialtyMatch = hasSymptom && provider.medicalSpecialty.toLowerCase().includes(normalizedSymptom);
      const distance = coordinates
        ? coordinateDistanceMiles(coordinates, {
            latitude: provider.clinicLatitude,
            longitude: provider.clinicLongitude,
          })
        : zipDistance(provider.clinicZipcode, zipcode);
      const proximityScore = coordinates ? Math.max(0, 180 - distance * 24) : Math.max(0, 140 - distance * 2);
      const matchScore =
        (conditionMatch ? 12 : 0) +
        (specialtyMatch ? 4 : 0) +
        proximityScore +
        provider.careAccessibilityScore * 0.08 +
        provider.careRating -
        provider.nextAvailableVisitDays * 0.25;

      return {
        ...provider,
        conditionMatch,
        distance,
        distanceLabel: coordinates ? `${distance.toFixed(2)} mi` : `${distance} ZIP units`,
        locationMatchLabel: coordinates
          ? distance < 0.15
            ? "on this block"
            : distance < 0.5
              ? "same walking area"
              : distance < 2
                ? "near your pin"
                : "closest available"
          : distance === 0
            ? "same ZIP"
            : distance < 25
              ? "nearby ZIP"
              : "closest available",
        matchScore,
      };
    })
    .sort((a, b) => {
      const locationDifference = a.distance - b.distance;
      const meaningfulLocationGap = coordinates ? 0.1 : 0;
      if (Math.abs(locationDifference) > meaningfulLocationGap) return locationDifference;
      return b.matchScore - a.matchScore;
    });
}
