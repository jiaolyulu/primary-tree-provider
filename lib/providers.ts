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

function sameOriginBackendBaseUrl() {
  return typeof window === "undefined" ? "" : `${window.location.origin}/_/backend`;
}

function providerApiBaseUrls() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_PROVIDER_API_BASE_URL?.trim().replace(/\/$/, "");
  const isLocalBrowser =
    typeof window !== "undefined" && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const baseUrl = configuredBaseUrl || (isLocalBrowser ? "http://127.0.0.1:8000" : "/_/backend");
  const urls: string[] = [];

  if (baseUrl.startsWith("/") && typeof window !== "undefined") {
    urls.push(`${window.location.origin}${baseUrl}`);
  } else if (typeof window !== "undefined") {
    const parsedUrl = new URL(baseUrl);
    const pointsAtCurrentSiteRoot = parsedUrl.origin === window.location.origin && parsedUrl.pathname === "/";
    urls.push(pointsAtCurrentSiteRoot ? sameOriginBackendBaseUrl() : parsedUrl.toString().replace(/\/$/, ""));
  } else {
    urls.push(baseUrl);
  }

  const sameOriginBackendUrl = sameOriginBackendBaseUrl();
  if (sameOriginBackendUrl) urls.push(sameOriginBackendUrl);

  return [...new Set(urls.filter(Boolean))];
}

function providerSearchUrl(
  apiBaseUrl: string,
  zipcode: string,
  symptom: string,
  coordinates?: { latitude: number; longitude: number },
) {
  const url = new URL("/api/providers/search", apiBaseUrl);
  url.searchParams.set("zip", zipcode);
  if (symptom.trim()) url.searchParams.set("symptom", symptom.trim());
  if (coordinates) {
    url.searchParams.set("lat", coordinates.latitude.toFixed(5));
    url.searchParams.set("lng", coordinates.longitude.toFixed(5));
  }
  return url;
}

export async function rankProviders(
  zipcode: string,
  symptom: string,
  coordinates?: { latitude: number; longitude: number },
): Promise<ProviderMatch[]> {
  const apiBaseUrls = providerApiBaseUrls();

  if (!apiBaseUrls.length) {
    throw new ProviderApiError("Provider API is not configured.");
  }

  let lastError = "Could not reach the provider database API.";

  for (const apiBaseUrl of apiBaseUrls) {
    const url = providerSearchUrl(apiBaseUrl, zipcode, symptom, coordinates);

    let response: Response;
    try {
      response = await fetch(url.toString(), { cache: "no-store" });
    } catch {
      lastError = "Could not reach the provider database API.";
      continue;
    }

    if (!response.ok) {
      lastError = `Provider database API returned ${response.status}.`;
      continue;
    }

    const payload = (await response.json()) as ProviderSearchPayload;
    if (!Array.isArray(payload.providers)) {
      throw new ProviderApiError("Provider database API returned an unexpected response.");
    }

    return payload.providers;
  }

  throw new ProviderApiError(lastError);
}
