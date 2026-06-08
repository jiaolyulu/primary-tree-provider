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

type ProviderSearchPayload = {
  providers?: ProviderMatch[];
};

export const providerNetworkStats = {
  totalProviders: 96950,
  zipCount: 183,
  specialtyCount: 30,
};

export class ProviderApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderApiError";
  }
}

function providerApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_PROVIDER_API_BASE_URL?.trim().replace(/\/$/, "");
  const isLocalBrowser =
    typeof window !== "undefined" && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const baseUrl = configuredBaseUrl || (isLocalBrowser ? "http://127.0.0.1:8000" : "/_/backend");

  if (baseUrl.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${baseUrl}`;
  }

  return baseUrl;
}

export async function rankProviders(
  zipcode: string,
  symptom: string,
  coordinates?: { latitude: number; longitude: number },
): Promise<ProviderMatch[]> {
  const apiBaseUrl = providerApiBaseUrl();

  if (!apiBaseUrl) {
    throw new ProviderApiError("Provider API is not configured.");
  }

  const url = new URL("/api/providers/search", apiBaseUrl);
  url.searchParams.set("zip", zipcode);
  if (symptom.trim()) url.searchParams.set("symptom", symptom.trim());
  if (coordinates) {
    url.searchParams.set("lat", coordinates.latitude.toFixed(5));
    url.searchParams.set("lng", coordinates.longitude.toFixed(5));
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), { cache: "no-store" });
  } catch {
    throw new ProviderApiError("Could not reach the provider database API.");
  }

  if (!response.ok) {
    throw new ProviderApiError(`Provider database API returned ${response.status}.`);
  }

  const payload = (await response.json()) as ProviderSearchPayload;
  if (!Array.isArray(payload.providers)) {
    throw new ProviderApiError("Provider database API returned an unexpected response.");
  }

  return payload.providers;
}
