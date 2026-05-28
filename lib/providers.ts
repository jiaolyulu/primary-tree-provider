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

export const providers: Provider[] = [
  {
    providerId: 239868,
    speciesCommon: "Ginkgo",
    speciesScientific: "Ginkgo biloba",
    medicalSpecialty: "Neurology",
    specialtyDescription:
      "Ginkgo maps to neurology through its cultural association with memory, attention, and cognition.",
    searchableConditions: ["memory changes", "migraine", "tremor", "headache", "dizziness", "brain fog"],
    providerType: "Highly rated shade specialist",
    treeExperienceLevel: "Seasoned canopy clinician",
    yearsOfPractice: 22,
    yearsAtCurrentSpot: 14,
    careRating: 5,
    reviewCount: 126,
    starDoctor: true,
    popularityBadge: "Star doctor",
    nextAvailableVisitDays: 3,
    weekendAvailability: true,
    stormResponseReadiness: "High",
    careAccessibilityScore: 96,
    shadeSideMannerScore: 4.9,
    carePhilosophy:
      "The practice treats attention as something shaped by shade, tempo, and the nervous system of the street.",
    providerBio:
      "This Ginkgo provider turns steady seasonal attention into a Neurology profile for visitors seeking focus, balance, and quieter cognitive weather.",
    clinicDescription:
      "Patients find the clinic at the curb, where a fan-shaped canopy filters light across a busy sidewalk waiting room.",
    patientReviewSummary:
      "Visitors describe the care as composed, observant, and unusually good at making a noisy block feel briefly organized.",
    careAudience: "Adults managing brain, nerve, and focus concerns",
    primaryCareServices: ["Migraine shade consult", "Memory-change intake", "Brain fog screening", "Dizziness triage"],
    signaturePrescription: "Twenty minutes under filtered light, followed by one slow block with no phone.",
    officeVibe: "Quiet focus with old-city stamina",
    waitingRoomFeature: "Fan-shaped leaves and a bench-adjacent pause",
    leafPaperworkLevel: "Light intake, careful follow-up",
    branchOfficeStatus: "Single-trunk practice",
    clinicName: "West Village Canopy Neurology",
    clinicAddress: "72 Grove St",
    clinicZipcode: "10014",
    clinicCity: "New York",
    clinicNeighborhood: "West Village",
    clinicState: "NY",
    clinicLatitude: 40.7335,
    clinicLongitude: -74.0027,
  },
  {
    providerId: 203799,
    speciesCommon: "Pin Oak",
    speciesScientific: "Quercus palustris",
    medicalSpecialty: "Geriatrics",
    specialtyDescription:
      "Oak species map to geriatrics because long-lived trees suggest elder care, continuity, and aging well.",
    searchableConditions: ["fall risk", "mobility changes", "caregiver planning", "frailty screening", "medication management"],
    providerType: "Elder shade practitioner",
    treeExperienceLevel: "Ancient attending",
    yearsOfPractice: 38,
    yearsAtCurrentSpot: 27,
    careRating: 4.5,
    reviewCount: 214,
    starDoctor: false,
    popularityBadge: "Neighborhood regular",
    nextAvailableVisitDays: 4,
    weekendAvailability: false,
    stormResponseReadiness: "High",
    careAccessibilityScore: 91,
    shadeSideMannerScore: 4.6,
    carePhilosophy:
      "Care is long-view, practical, and rooted in helping residents move through the neighborhood with less friction.",
    providerBio:
      "In Brooklyn, this Pin Oak offers a durable Geriatrics profile for people thinking about balance, mobility, and support systems.",
    clinicDescription:
      "The practice sits on a residential sidewalk with broad shade, slow crossings, and an excellent view of daily routines.",
    patientReviewSummary:
      "Reviews praise the reliable canopy, the patient pace, and the feeling that no one is rushed through their visit.",
    careAudience: "Older adults and caregivers",
    primaryCareServices: ["Mobility review", "Fall-risk check", "Caregiver planning", "Medication-list shade audit"],
    signaturePrescription: "Two familiar routes, one new handrail noticed, and a rest stop before fatigue arrives.",
    officeVibe: "Steady elder care with block-level memory",
    waitingRoomFeature: "Deep shade and predictable sidewalk rhythms",
    leafPaperworkLevel: "Moderate seasonal forms",
    branchOfficeStatus: "Wide canopy network",
    clinicName: "Park Slope Elder Shade Clinic",
    clinicAddress: "418 7th Ave",
    clinicZipcode: "11215",
    clinicCity: "Brooklyn",
    clinicNeighborhood: "Park Slope",
    clinicState: "NY",
    clinicLatitude: 40.6703,
    clinicLongitude: -73.9817,
  },
  {
    providerId: 110153,
    speciesCommon: "Japanese Zelkova",
    speciesScientific: "Zelkova serrata",
    medicalSpecialty: "Dermatology",
    specialtyDescription:
      "Zelkova maps to dermatology through bark, surface texture, and skin-like protective layers.",
    searchableConditions: ["skin rash", "eczema", "acne", "dry skin", "mole checks", "sun damage"],
    providerType: "Friendly curbside generalist",
    treeExperienceLevel: "Established neighborhood healer",
    yearsOfPractice: 16,
    yearsAtCurrentSpot: 10,
    careRating: 4.1,
    reviewCount: 53,
    starDoctor: false,
    popularityBadge: "Neighborhood regular",
    nextAvailableVisitDays: 8,
    weekendAvailability: true,
    stormResponseReadiness: "Standard",
    careAccessibilityScore: 88,
    shadeSideMannerScore: 4.2,
    carePhilosophy:
      "Surface care begins with noticing exposure: sun, wind, dust, friction, and the block's daily abrasion.",
    providerBio:
      "This Japanese Zelkova uses bark-aware dermatology to help visitors read skin concerns as environmental records.",
    clinicDescription:
      "The clinic occupies a bright Queens sidewalk where shade arrives in sections and the bark does most of the explaining.",
    patientReviewSummary:
      "Patients like the practical advice, especially the reminder that exposure and recovery both happen outside.",
    careAudience: "People with skin and surface concerns",
    primaryCareServices: ["Rash intake", "Dry-skin consult", "Sun exposure review", "Eczema flare planning"],
    signaturePrescription: "Find partial shade before noon and moisturize like the sidewalk has opinions.",
    officeVibe: "Crisp, observant, bark-forward",
    waitingRoomFeature: "Dappled light and tidy curb geometry",
    leafPaperworkLevel: "Low-friction forms",
    branchOfficeStatus: "Balanced branch coverage",
    clinicName: "Astoria Bark Dermatology",
    clinicAddress: "31-14 30th Ave",
    clinicZipcode: "11102",
    clinicCity: "Astoria",
    clinicNeighborhood: "Astoria",
    clinicState: "NY",
    clinicLatitude: 40.7645,
    clinicLongitude: -73.9229,
  },
  {
    providerId: 186329,
    speciesCommon: "Sophora",
    speciesScientific: "Styphnolobium japonicum",
    medicalSpecialty: "Allergy and Immunology",
    specialtyDescription:
      "Sophora maps to allergy and immunology through flowering, pollen, and immune-response associations.",
    searchableConditions: ["seasonal allergies", "hives", "asthma triggers", "immune concerns", "sinus congestion", "eczema flares"],
    providerType: "Popular canopy clinician",
    treeExperienceLevel: "Established neighborhood healer",
    yearsOfPractice: 18,
    yearsAtCurrentSpot: 11,
    careRating: 4.3,
    reviewCount: 92,
    starDoctor: true,
    popularityBadge: "Star doctor",
    nextAvailableVisitDays: 2,
    weekendAvailability: true,
    stormResponseReadiness: "Medium",
    careAccessibilityScore: 93,
    shadeSideMannerScore: 4.7,
    carePhilosophy:
      "The work is diplomatic: helping pollen, breath, skin, and the immune system negotiate a crowded city block.",
    providerBio:
      "This Sophora provider offers allergy-minded care for residents tracking symptoms across seasons and street conditions.",
    clinicDescription:
      "The practice is planted near transit, where wind patterns, flowering cycles, and human routines overlap.",
    patientReviewSummary:
      "Reviewers praise the fast access and the very specific advice about when a block feels different from one week to the next.",
    careAudience: "Seasonal allergy and immune-response patients",
    primaryCareServices: ["Pollen exposure review", "Asthma trigger mapping", "Hives consult", "Sinus congestion planning"],
    signaturePrescription: "Check the wind, pick the shaded side, and let the first sneeze count as data.",
    officeVibe: "Pollen-diplomatic and transit-aware",
    waitingRoomFeature: "Flower litter, bus breeze, and fast-moving shade",
    leafPaperworkLevel: "Star-practice intake",
    branchOfficeStatus: "Street-corner branch coverage",
    clinicName: "Jackson Heights Immune Canopy",
    clinicAddress: "37-12 74th St",
    clinicZipcode: "11372",
    clinicCity: "Jackson Heights",
    clinicNeighborhood: "Jackson Heights",
    clinicState: "NY",
    clinicLatitude: 40.7476,
    clinicLongitude: -73.8919,
  },
  {
    providerId: 499220,
    speciesCommon: "Littleleaf Linden",
    speciesScientific: "Tilia cordata",
    medicalSpecialty: "Psychiatry",
    specialtyDescription:
      "Linden maps to psychiatry through calming cultural associations with rest, mood, and the nervous system.",
    searchableConditions: ["anxiety", "depression", "insomnia", "stress management", "burnout", "panic symptoms"],
    providerType: "Quiet courtyard specialist",
    treeExperienceLevel: "Seasoned canopy clinician",
    yearsOfPractice: 24,
    yearsAtCurrentSpot: 16,
    careRating: 4.4,
    reviewCount: 76,
    starDoctor: false,
    popularityBadge: "Neighborhood regular",
    nextAvailableVisitDays: 6,
    weekendAvailability: false,
    stormResponseReadiness: "Standard",
    careAccessibilityScore: 86,
    shadeSideMannerScore: 4.8,
    carePhilosophy:
      "Mental health care is framed as a relationship between nervous systems, street noise, rest, and repeated shelter.",
    providerBio:
      "This Littleleaf Linden provides calm-canopy psychiatry for symptoms that worsen when the city stops feeling porous.",
    clinicDescription:
      "Patients wait beneath small, heart-shaped leaves that make the sidewalk feel less like a corridor and more like a pause.",
    patientReviewSummary:
      "Visitors describe the experience as quiet, grounding, and best suited to people who need care without spectacle.",
    careAudience: "People managing mood, stress, and sleep symptoms",
    primaryCareServices: ["Anxiety intake", "Burnout check", "Sleep rhythm review", "Panic symptom planning"],
    signaturePrescription: "Sit where the leaves break the noise into smaller pieces.",
    officeVibe: "Calm canopy, low voice, long pause",
    waitingRoomFeature: "Heart-shaped leaves and a reliable patch of quiet",
    leafPaperworkLevel: "Gentle forms",
    branchOfficeStatus: "Courtyard-adjacent practice",
    clinicName: "Midwood Linden Psychiatry",
    clinicAddress: "1921 Avenue K",
    clinicZipcode: "11230",
    clinicCity: "Brooklyn",
    clinicNeighborhood: "Midwood",
    clinicState: "NY",
    clinicLatitude: 40.6221,
    clinicLongitude: -73.9557,
  },
  {
    providerId: 583615,
    speciesCommon: "Sweetgum",
    speciesScientific: "Liquidambar styraciflua",
    medicalSpecialty: "Endocrinology",
    specialtyDescription:
      "Sweetgum maps to endocrinology through sap, sugar, seasonal energy, metabolism, and hormonal rhythm.",
    searchableConditions: ["diabetes", "metabolic syndrome", "weight changes", "hormone imbalance", "fatigue", "prediabetes"],
    providerType: "Preventive canopy specialist",
    treeExperienceLevel: "Established neighborhood healer",
    yearsOfPractice: 14,
    yearsAtCurrentSpot: 8,
    careRating: 4.4,
    reviewCount: 64,
    starDoctor: false,
    popularityBadge: "Neighborhood regular",
    nextAvailableVisitDays: 9,
    weekendAvailability: true,
    stormResponseReadiness: "Standard",
    careAccessibilityScore: 90,
    shadeSideMannerScore: 4.3,
    carePhilosophy:
      "Metabolic care follows cycles: sunlight, movement, meals, rest, and the way a block changes from season to season.",
    providerBio:
      "This Sweetgum offers sap-balanced endocrinology for visitors navigating energy, glucose, and seasonal fatigue.",
    clinicDescription:
      "The clinic is a broad-canopy sidewalk practice with enough shade to make a slow nutrition conversation plausible.",
    patientReviewSummary:
      "Reviews note practical guidance, steady shade, and a surprisingly persuasive argument for walking after lunch.",
    careAudience: "People tracking metabolism, energy, and hormone concerns",
    primaryCareServices: ["Prediabetes planning", "Fatigue review", "Weight-change intake", "Metabolic rhythm check"],
    signaturePrescription: "A shaded walk after meals and a seasonal check-in before the next heat wave.",
    officeVibe: "Sap-balanced and practical",
    waitingRoomFeature: "Star-shaped leaves and rolling seed pods",
    leafPaperworkLevel: "Moderate prevention forms",
    branchOfficeStatus: "Canopy clinic with steady overflow",
    clinicName: "Forest Hills Metabolic Canopy",
    clinicAddress: "108-19 71st Ave",
    clinicZipcode: "11375",
    clinicCity: "Forest Hills",
    clinicNeighborhood: "Forest Hills",
    clinicState: "NY",
    clinicLatitude: 40.7216,
    clinicLongitude: -73.8448,
  },
];

export type ProviderMatch = Provider & {
  conditionMatch: boolean;
  distance: number;
  distanceLabel: string;
  matchScore: number;
};

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

export function rankProviders(
  zipcode: string,
  symptom: string,
  coordinates?: { latitude: number; longitude: number },
): ProviderMatch[] {
  const normalizedSymptom = symptom.trim().toLowerCase();

  return providers
    .map((provider) => {
      const conditionMatch = provider.searchableConditions.some((condition) =>
        condition.toLowerCase().includes(normalizedSymptom),
      );
      const specialtyMatch = provider.medicalSpecialty.toLowerCase().includes(normalizedSymptom);
      const distance = coordinates
        ? coordinateDistanceMiles(coordinates, {
            latitude: provider.clinicLatitude,
            longitude: provider.clinicLongitude,
          })
        : zipDistance(provider.clinicZipcode, zipcode);
      const proximityScore = coordinates ? Math.max(0, 72 - distance * 7.5) : Math.max(0, 54 - distance / 2);
      const matchScore =
        (conditionMatch ? 34 : 0) +
        (specialtyMatch ? 14 : 0) +
        proximityScore +
        provider.careRating * 4 +
        (provider.starDoctor ? 7 : 0) -
        provider.nextAvailableVisitDays;

      return {
        ...provider,
        conditionMatch,
        distance,
        distanceLabel: coordinates ? `${distance.toFixed(1)} mi` : `${distance} ZIP units`,
        matchScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
