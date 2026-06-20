"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Apple,
  Baby,
  Bone,
  Brain,
  ClipboardCheck,
  Droplet,
  Ear,
  ExternalLink,
  Eye,
  Flower2,
  HeartPulse,
  type LucideIcon,
  MapPin,
  Microscope,
  Moon,
  Search,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Syringe,
  Thermometer,
  Utensils,
  Wind,
  Zap,
} from "lucide-react";
import { IntakeForm } from "@/components/IntakeForm";
import { ProviderCardDialog } from "@/components/ProviderCardDialog";
import { ProviderLearnMoreDialog } from "@/components/ProviderLearnMoreDialog";
import { ProviderResultsMap } from "@/components/ProviderResultsMap";
import { DEFAULT_PROVIDER_RESULT_LIMIT, fetchProviderById, ProviderMatch, rankProviders } from "@/lib/providers";
import { getTreeImageForProvider } from "@/lib/treeImageSources";

function titleCaseAddress(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function googleMapsCoordinateUrl(provider: ProviderMatch) {
  return `https://www.google.com/maps/search/?api=1&query=${provider.clinicLatitude.toFixed(6)},${provider.clinicLongitude.toFixed(6)}`;
}

// Cache resolved species photos so we fetch Wikipedia once per scientific name.
const speciesImageCache = new Map<string, string>();

function TreeImage({ provider, className }: { provider: ProviderMatch; className: string }) {
  const fallback = getTreeImageForProvider(provider);
  const scientific = provider.speciesScientific?.trim() ?? "";
  const [src, setSrc] = useState(() => speciesImageCache.get(scientific) ?? fallback);

  useEffect(() => {
    if (!scientific) return;
    const cached = speciesImageCache.get(scientific);
    if (cached) {
      setSrc(cached);
      return;
    }
    setSrc(fallback);
    let active = true;
    const title = encodeURIComponent(scientific.replace(/\s+/g, "_"));
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const url: string | undefined = data?.thumbnail?.source ?? data?.originalimage?.source;
        if (!url) return;
        speciesImageCache.set(scientific, url);
        if (active) setSrc(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [scientific, fallback]);

  return <img className={className} src={src} alt={`${provider.speciesCommon} tree`} loading="lazy" />;
}

const conditionIconRules: Array<[RegExp, LucideIcon]> = [
  [/vaccinat|immuniz/, Syringe],
  [/blood pressure|cholesterol|chest pain|heart|palpitation|circulation|clot|vein|vascular|cold feet/, HeartPulse],
  [/anxiety|depression|stress|burnout|mood|panic/, Smile],
  [/insomnia|sleep|snor|apnea|drowsi|restless/, Moon],
  [/memory|migraine|headache|brain|dizz|numb|tingl|tremor|fog/, Brain],
  [/asthma|cough|breath|copd|bronch|wheez|lung|respir/, Wind],
  [/cancer|lump|tumor|survivorship|imaging|weight loss/, Microscope],
  [/joint|arthritis|back|hip|shoulder|knee|bone|fracture|sprain|strain|mobility|stiffness|gout|muscle|overuse|running/, Bone],
  [/nerve|pain/, Zap],
  [/eye|vision|glaucoma|cataract/, Eye],
  [/ear|hearing|sinus|throat|voice|nasal|congestion/, Ear],
  [/reflux|stomach|ibs|constip|diarrhea|bloat|colon|digest|acid/, Utensils],
  [/skin|acne|eczema|psoriasis|rash|sun|mole|hives/, Sparkles],
  [/weight|nutrition|eating|meal|diet|diabet|thyroid|hormone|metabolic/, Apple],
  [/allerg|immune/, Flower2],
  [/fever|infection|flu|wound|antibiotic|travel/, Thermometer],
  [/kidney|urinary|bladder|prostate|incontinen|urine|stone|electrolyte|fluid/, Droplet],
  [/anemia|iron|blood count|bruis|bleed/, Droplet],
  [/fall|caregiver|aging|growth/, Activity],
  [/woman|menstr|menopause|pelvic|breast|contracept/, Flower2],
  [/childhood|pediatr|school/, Baby],
];

function conditionIcon(condition: string): LucideIcon {
  const value = condition.toLowerCase();
  for (const [pattern, Icon] of conditionIconRules) {
    if (pattern.test(value)) return Icon;
  }
  return ClipboardCheck;
}

function reviewCountLabel(count: number) {
  return `${count} ${count === 1 ? "review" : "reviews"}`;
}

export function ProviderDashboard() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const zipcode = params.get("zip") || "11215";
  const symptom = params.get("symptom")?.trim() || "";
  const symptomLabel = symptom || "general care";
  const hasSymptom = symptom.length > 0;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));
  const hasPinnedLocation = params.get("location") === "pin" && Number.isFinite(latitude) && Number.isFinite(longitude);
  const preferredId = Number(params.get("id")) || null;
  const originLabel = hasPinnedLocation ? "your dropped pin" : zipcode;
  const [rankedProviders, setRankedProviders] = useState<ProviderMatch[] | null>(null);
  const [pinnedProvider, setPinnedProvider] = useState<ProviderMatch | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [detailProvider, setDetailProvider] = useState<ProviderMatch | null>(null);
  const [cardProvider, setCardProvider] = useState<ProviderMatch | null>(null);
  const [sortBy, setSortBy] = useState("match");
  const [displayLimit, setDisplayLimit] = useState(DEFAULT_PROVIDER_RESULT_LIMIT);
  const [loadError, setLoadError] = useState("");
  const [mapFocusRequest, setMapFocusRequest] = useState<{ providerId: number; requestId: number } | null>(null);
  const providerCardRefs = useRef(new Map<number, HTMLElement>());

  const scrollProviderCardIntoView = useCallback((providerId: number) => {
    window.requestAnimationFrame(() => {
      providerCardRefs.current.get(providerId)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, []);

  const selectProviderFromMap = useCallback(
    (providerId: number) => {
      setSelectedProviderId(providerId);
      scrollProviderCardIntoView(providerId);
    },
    [scrollProviderCardIntoView],
  );

  const selectProviderFromCard = (providerId: number) => {
    setSelectedProviderId(providerId);
    setMapFocusRequest((request) => ({
      providerId,
      requestId: (request?.requestId ?? 0) + 1,
    }));
  };

  // Fetch the directly-clicked provider by ID so it always appears regardless of search ranking.
  useEffect(() => {
    if (!preferredId) { setPinnedProvider(null); return; }
    let isCurrent = true;
    fetchProviderById(preferredId).then((p) => {
      if (isCurrent) setPinnedProvider(p);
    });
    return () => { isCurrent = false; };
  }, [preferredId]);

  useEffect(() => {
    let isCurrent = true;
    setRankedProviders(null);
    setDisplayLimit(DEFAULT_PROVIDER_RESULT_LIMIT);
    setLoadError("");

    rankProviders(zipcode, symptom, hasPinnedLocation ? { latitude, longitude } : undefined)
      .then((matches) => {
        if (!isCurrent) return;
        setRankedProviders(matches);
        setSelectedProviderId(preferredId ?? matches[0]?.providerId ?? null);
      })
      .catch(() => {
        if (!isCurrent) return;
        setRankedProviders([]);
        setSelectedProviderId(null);
        setLoadError("We're having trouble loading provider matches. Please refresh or try again soon.");
      });

    return () => {
      isCurrent = false;
    };
  }, [zipcode, symptom, hasPinnedLocation, latitude, longitude]);

  const searchForm = (
    <IntakeForm
      compact
      initialZip={zipcode}
      initialSymptom={symptom}
      initialLat={hasPinnedLocation ? latitude : undefined}
      initialLng={hasPinnedLocation ? longitude : undefined}
      initialLocationMode={hasPinnedLocation ? "pin" : "zip"}
    />
  );

  const openCardDialog = (provider: ProviderMatch) => {
    setDetailProvider(null);
    setCardProvider(provider);
  };

  if (loadError) {
    return (
      <main className="provider-search-page">
        <header className="provider-search-topbar">
          <Link href="/" className="provider-logo" aria-label="Primary Care Tree — home">
            <img src="/images/tree-logo.svg" alt="Primary Care Tree" />
          </Link>
          <div className="provider-search-form">{searchForm}</div>
        </header>

        <section className="provider-search-loading" aria-label="Provider matches unavailable">
          <div className="eyebrow dark">
            <Search aria-hidden="true" size={15} />
            {symptomLabel} near {originLabel}
          </div>
          <div className="dashboard-error-panel" role="alert">
            <span>Provider matches unavailable</span>
            <h2>We could not load nearby Primary Care Tree.</h2>
            <p>{loadError}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!rankedProviders?.length) {
    return (
      <main className="provider-search-page">
        <header className="provider-search-topbar">
          <Link href="/" className="provider-logo" aria-label="Primary Care Tree — home">
            <img src="/images/tree-logo.svg" alt="Primary Care Tree" />
          </Link>
          <div className="provider-search-form">{searchForm}</div>
        </header>

        <section className="provider-search-loading" aria-label="Loading provider dashboard">
          <div className="eyebrow dark">
            <Search aria-hidden="true" size={15} />
            {symptomLabel} near {originLabel}
          </div>
          <div className="provider-search-skeleton">
            <div className="loading-map-preview">
              <span />
              <span />
              <span />
            </div>
            <div className="loading-provider-preview">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>
      </main>
    );
  }

  const sortedProviders = (() => {
    const copy = [...rankedProviders];
    switch (sortBy) {
      case "rating":
        copy.sort((a, b) => b.careRating - a.careRating);
        break;
      case "manner":
        copy.sort((a, b) => b.shadeSideMannerScore - a.shadeSideMannerScore);
        break;
      case "experience":
        copy.sort((a, b) => b.yearsOfPractice - a.yearsOfPractice);
        break;
      case "reviews":
        copy.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "distance":
        copy.sort((a, b) => a.distance - b.distance);
        break;
      default:
        break;
    }
    return copy;
  })();
  const displayedProviders = (() => {
    const limit = pinnedProvider ? displayLimit - 1 : displayLimit;
    const base = sortedProviders.filter((p) => p.providerId !== preferredId).slice(0, limit);
    return pinnedProvider ? [pinnedProvider, ...base] : base;
  })();
  const hasMore = sortedProviders.length + (pinnedProvider ? 1 : 0) > displayLimit;
  const selectedProvider =
    displayedProviders.find((provider) => provider.providerId === selectedProviderId) || displayedProviders[0];
  const selectedLatitude = selectedProvider.clinicLatitude;
  const selectedLongitude = selectedProvider.clinicLongitude;

  return (
    <main className="provider-search-page">
      <header className="provider-search-topbar">
        <Link href="/" className="provider-logo" aria-label="Primary Care Tree — home">
          <img src="/images/tree-logo.svg" alt="Primary Care Tree" />
        </Link>
        <div className="provider-search-form">{searchForm}</div>
      </header>

      <section className="provider-search-summary" aria-label="Search summary">
        <div className="provider-result-count">
          <ShieldCheck aria-hidden="true" size={24} />
          <div>
            <strong>{rankedProviders.length.toLocaleString()} care providers</strong>
            <span>
              {symptomLabel} near {originLabel}
            </span>
          </div>
        </div>
        <div className="provider-sort">
          <label htmlFor="provider-sort-select">Sort by</label>
          <select
            id="provider-sort-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="match">Best match</option>
            <option value="rating">Rating</option>
            <option value="manner">Shade-side manner</option>
            <option value="experience">Years of experience</option>
            <option value="reviews">Most reviewed</option>
            <option value="distance">Nearest</option>
          </select>
        </div>
      </section>

      <section className="provider-search-layout" aria-label="Provider search results">
        <aside className="provider-map-panel" aria-label="Provider map">
          <div className="provider-map-canvas">
            <ProviderResultsMap
              providers={displayedProviders}
              selectedProviderId={selectedProvider.providerId}
              focusProviderId={mapFocusRequest?.providerId ?? null}
              focusRequestId={mapFocusRequest?.requestId ?? 0}
              onSelectProvider={selectProviderFromMap}
            />
            <a
              className="map-coordinate-card"
              href={googleMapsCoordinateUrl(selectedProvider)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${selectedProvider.speciesCommon} coordinates in Google Maps`}
            >
              <MapPin aria-hidden="true" size={16} />
              <span>
                {selectedLatitude.toFixed(4)}, {selectedLongitude.toFixed(4)}
              </span>
              <ExternalLink aria-hidden="true" size={13} />
            </a>
          </div>
        </aside>

        <section className="provider-doctor-panel" aria-label="Care providers">
          <div className="provider-doctor-list">
            {displayedProviders.map((provider, index) => {
              const isSelected = provider.providerId === selectedProvider.providerId;
              const conditionTags = provider.searchableConditions.slice(0, 3);

              return (
                <article
                  key={provider.providerId}
                  ref={(node) => {
                    if (node) {
                      providerCardRefs.current.set(provider.providerId, node);
                    } else {
                      providerCardRefs.current.delete(provider.providerId);
                    }
                  }}
                  className={isSelected ? "provider-card selected" : "provider-card"}
                >
                  <button
                    type="button"
                    className="provider-card-select"
                    aria-pressed={isSelected}
                    onClick={() => selectProviderFromCard(provider.providerId)}
                  >
                    <div className="provider-card-media">
                      <TreeImage provider={provider} className="provider-tree-avatar" />
                      <span className="provider-card-rank">{index + 1}</span>
                    </div>

                    <div className="provider-card-body">
                      <span className="provider-card-eyebrow">
                        {provider.medicalSpecialty} · {provider.clinicNeighborhood}
                      </span>
                      <h3>{provider.speciesCommon}</h3>
                      <div className="provider-rating">
                        <Star aria-hidden="true" size={14} />
                        <strong>{provider.careRating.toFixed(1)}</strong>
                        <span>({reviewCountLabel(provider.reviewCount)})</span>
                      </div>
                      <address>
                        {titleCaseAddress(provider.clinicAddress)}, {provider.clinicCity}, {provider.clinicState}{" "}
                        {provider.clinicZipcode}
                      </address>
                      <div className="condition-chips" aria-label={`${provider.speciesCommon} symptoms`}>
                        {conditionTags.map((condition) => {
                          const ConditionIcon = conditionIcon(condition);
                          return (
                            <span key={condition}>
                              <ConditionIcon aria-hidden="true" size={13} />
                              {condition}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {provider.starDoctor ? (
                      <span className="star-pill">
                        <Star aria-hidden="true" size={13} />
                        Star
                      </span>
                    ) : null}
                  </button>

                  {isSelected ? (
                    <div className="provider-card-expanded">
                      <p>{provider.signaturePrescription}</p>
                    </div>
                  ) : null}

                  <div className="provider-card-foot">
                    <a
                      className="tree-map-link"
                      href={googleMapsCoordinateUrl(provider)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${provider.speciesCommon} in Google Maps`}
                    >
                      <MapPin aria-hidden="true" size={14} />
                      Map
                    </a>
                    <button
                      type="button"
                      className="tree-learn-more"
                      onClick={() => setDetailProvider(provider)}
                    >
                      Learn more
                    </button>
                    <button type="button" className="provider-choose-btn" onClick={() => openCardDialog(provider)}>
                      Choose as Primary PCT
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {hasMore && (
            <button
              type="button"
              className="provider-load-more"
              onClick={() => setDisplayLimit((n) => n + DEFAULT_PROVIDER_RESULT_LIMIT)}
            >
              Load more providers in this area
            </button>
          )}
        </section>
      </section>

      {detailProvider ? (
        <ProviderLearnMoreDialog
          provider={detailProvider}
          onClose={() => setDetailProvider(null)}
          onChoose={openCardDialog}
        />
      ) : null}

      {cardProvider ? (
        <ProviderCardDialog provider={cardProvider} zipcode={zipcode} onClose={() => setCardProvider(null)} />
      ) : null}
    </main>
  );
}
