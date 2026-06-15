"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Apple,
  Baby,
  Bone,
  Brain,
  ClipboardCheck,
  Download,
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
  Printer,
  Search,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Syringe,
  Thermometer,
  Utensils,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { IntakeForm } from "@/components/IntakeForm";
import { downloadProviderCardPdf, printProviderCardPdf, PctProviderCardSvgPair } from "@/components/PctProviderCard";
import { ProviderResultsMap } from "@/components/ProviderResultsMap";
import { fetchProviderById, ProviderMatch, rankProviders } from "@/lib/providers";
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

function estimatedTreeAge(provider: ProviderMatch) {
  return provider.yearsOfPractice;
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

function seededHash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function seededPick<T>(items: T[], seed: string, offset = 0): T {
  return items[seededHash(`${seed}:${offset}`) % items.length];
}

const reviewerNames = [
  "Marisol P.",
  "A regular on the B61",
  "Stoop neighbor, two doors down",
  "Dog-walker, 7am shift",
  "Biscuit the corgi (via owner)",
  "Crossing guard at the corner",
  "Someone subletting upstairs",
  "Tuesday farmers-market vendor",
  "Night-shift nurse heading home",
  "Kid on a scooter (parent typing)",
  "Retired super, 30 yrs on the block",
  "The bench across the street",
];

const reviewDates = [
  "last spring",
  "after the first heat wave",
  "during a string of bad meetings",
  "two weeks ago",
  "the week the AC broke",
  "mid-pollen season",
  "right before the time change",
  "on a humid Thursday",
  "the day the forecast lied",
];

const reviewTemplates = [
  "Came in for {condition}. The {species} actually treated it — a {specialty} plan I could keep up with, and it eased within a couple weeks.",
  "I'd bounced between clinics for {condition}. This {species} handled the {specialty} side patiently and it finally made sense.",
  "Best {specialty} care on the block. They pinned down what was driving my {condition} and gave me one simple thing to do.",
  "Skeptical a tree could help my {condition}, but the {specialty} treatment was the real deal — flare-ups way down.",
  "Came for {condition}, left understanding it. The {species} explained the {specialty} part without rushing or scaring me.",
  "My {condition} is finally manageable. Whatever this {species} does for {specialty}, it works.",
  "Direct, specific {specialty}. Took my {condition} seriously, never alarmist, and the follow-up actually helped.",
  "Referred here for {condition} and stayed. This {species} treats {specialty} like it matters.",
  "Five stars for {specialty}. The {species} caught my {condition} early and the plan was easy to stick to.",
  "Years of {condition} and no one connected the dots until this {species}. Genuinely good {specialty} care.",
  "Gentle but thorough on my {condition} — the kind of {specialty} attention you don't get in a ten-minute visit.",
  "Whole family sees this {species} now: my {condition} and my partner's {condition2} handled with the same calm {specialty} approach.",
  "Came in stressed about {condition}. Left with a clear {specialty} plan and a lot less worry.",
  "The only provider who made progress on my {condition}. Real {specialty}, no gimmicks — just steady {species} care.",
];

function generateReviews(provider: ProviderMatch) {
  const seed = String(provider.providerId);
  const count = Math.max(0, Math.min(provider.reviewCount, 4));
  const conditions = provider.searchableConditions.length
    ? provider.searchableConditions
    : ["the symptom"];
  const specialty = provider.medicalSpecialty.toLowerCase();
  // Rotate through each pool from a seeded start so names, dates, templates,
  // and the highlighted condition stay distinct within one tree's list.
  const nameStart = seededHash(`${seed}:name`) % reviewerNames.length;
  const dateStart = seededHash(`${seed}:date`) % reviewDates.length;
  const templateStart = seededHash(`${seed}:tpl`) % reviewTemplates.length;
  const condStart = seededHash(`${seed}:cond`) % conditions.length;
  return Array.from({ length: count }, (_, index) => {
    const condition = conditions[(condStart + index) % conditions.length];
    const condition2 = conditions[(condStart + index + 1) % conditions.length];
    const text = reviewTemplates[(templateStart + index) % reviewTemplates.length]
      .split("{species}").join(provider.speciesCommon)
      .split("{hood}").join(provider.clinicNeighborhood)
      .split("{condition2}").join(condition2)
      .split("{condition}").join(condition)
      .split("{specialty}").join(specialty);
    return {
      id: index,
      name: reviewerNames[(nameStart + index) % reviewerNames.length],
      when: reviewDates[(dateStart + index * 2) % reviewDates.length],
      stars: seededPick([5, 5, 5, 4, 4, 3], seed, index * 7 + 1),
      text,
    };
  });
}

function openHoursLabel(provider: ProviderMatch) {
  return provider.weekendAvailability ? "Dawn-dusk, weekends available" : "Dawn-dusk, weekdays only";
}

function reviewCountLabel(count: number) {
  return `${count} ${count === 1 ? "review" : "reviews"}`;
}

function ratingBreakdown(provider: ProviderMatch) {
  const seed = String(provider.providerId);
  const weights = [
    55 + (seededHash(`${seed}:5`) % 25),
    12 + (seededHash(`${seed}:4`) % 18),
    4 + (seededHash(`${seed}:3`) % 8),
    seededHash(`${seed}:2`) % 5,
    seededHash(`${seed}:1`) % 4,
  ];
  const total = weights.reduce((sum, value) => sum + value, 0);
  return [5, 4, 3, 2, 1].map((star, index) => ({
    star,
    pct: Math.round((weights[index] / total) * 100),
  }));
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
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [isPrintingCard, setIsPrintingCard] = useState(false);
  const [cardDownloadError, setCardDownloadError] = useState("");
  const [sortBy, setSortBy] = useState("match");
  const [displayLimit, setDisplayLimit] = useState(8);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!detailProvider && !cardProvider) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (cardProvider) {
        setCardProvider(null);
      } else {
        setDetailProvider(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [detailProvider, cardProvider]);

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
    setDisplayLimit(8);
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
    setIsDownloadingCard(false);
    setIsPrintingCard(false);
    setCardDownloadError("");
  };

  const downloadCardPdf = async () => {
    if (!cardProvider) return;
    setIsDownloadingCard(true);
    setCardDownloadError("");
    try {
      await downloadProviderCardPdf(`pct-provider-card-dialog-${cardProvider.providerId}`, cardProvider);
    } catch {
      setCardDownloadError("We could not prepare the PDF. Please try again.");
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const printCardPdf = async () => {
    if (!cardProvider) return;
    setIsPrintingCard(true);
    setCardDownloadError("");
    try {
      await printProviderCardPdf(`pct-provider-card-dialog-${cardProvider.providerId}`);
    } catch {
      setCardDownloadError("We could not prepare the card for printing. Please try again.");
    } finally {
      setIsPrintingCard(false);
    }
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
              onSelectProvider={setSelectedProviderId}
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
                <article key={provider.providerId} className={isSelected ? "provider-card selected" : "provider-card"}>
                  <button
                    type="button"
                    className="provider-card-select"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedProviderId(provider.providerId)}
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
              onClick={() => setDisplayLimit((n) => n + 8)}
            >
              Load more providers in this area
            </button>
          )}
        </section>
      </section>

      {detailProvider
        ? (() => {
            const reviews = generateReviews(detailProvider);
            const breakdown = ratingBreakdown(detailProvider);
            const tiles = [
              { label: "Doctor ID", value: String(detailProvider.providerId) },
              { label: "Years of experience", value: `~${estimatedTreeAge(detailProvider)} yrs` },
              { label: "Clinic environment", value: detailProvider.waitingRoomFeature },
              { label: "Shade-side manner", value: detailProvider.shadeSideMannerScore.toFixed(1) },
              { label: "Open hours", value: openHoursLabel(detailProvider) },
            ];
            return (
              <div
                className="tree-detail-overlay"
                role="dialog"
                aria-modal="true"
                aria-label={`${detailProvider.speciesCommon} details`}
                onClick={() => setDetailProvider(null)}
              >
                <div className="tree-detail-modal" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="tree-detail-close"
                    onClick={() => setDetailProvider(null)}
                    aria-label="Close"
                  >
                    <X aria-hidden="true" size={18} />
                  </button>

                  <div className="tree-detail-head">
                    <TreeImage provider={detailProvider} className="tree-detail-photo" />
                    <div>
                      <span className="provider-card-eyebrow">
                        {detailProvider.medicalSpecialty} · {detailProvider.clinicNeighborhood}
                      </span>
                      <h2>{detailProvider.speciesCommon}</h2>
                      <div className="provider-rating">
                        <Star aria-hidden="true" size={15} />
                        <strong>{detailProvider.careRating.toFixed(1)}</strong>
                        <span>({reviewCountLabel(detailProvider.reviewCount)})</span>
                      </div>
                      <p className="tree-detail-address">
                        {titleCaseAddress(detailProvider.clinicAddress)}, {detailProvider.clinicCity},{" "}
                        {detailProvider.clinicState} {detailProvider.clinicZipcode}
                      </p>
                      <a
                        className="tree-detail-map-link"
                        href={googleMapsCoordinateUrl(detailProvider)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPin aria-hidden="true" size={14} />
                        Open exact coordinates in Google Maps
                        <ExternalLink aria-hidden="true" size={13} />
                      </a>
                    </div>
                  </div>

                  <div className="tree-detail-tiles">
                    {tiles.map((tile) => (
                      <div key={tile.label} className="tree-detail-tile">
                        <strong>{tile.value}</strong>
                        <span>{tile.label}</span>
                      </div>
                    ))}
                  </div>

                  <blockquote className="tree-detail-prescription">
                    {detailProvider.signaturePrescription}
                  </blockquote>

                  <p className="tree-detail-philosophy">{detailProvider.carePhilosophy}</p>

                  <div className="tree-detail-ratings">
                    <div className="tree-detail-score">
                      <strong>{detailProvider.careRating.toFixed(1)}</strong>
                      <span>out of 5</span>
                    </div>
                    <div className="tree-detail-bars">
                      {breakdown.map((row) => (
                        <div key={row.star} className="tree-detail-bar-row">
                          <span className="tree-detail-bar-label">{row.star}★</span>
                          <span className="tree-detail-bar-track">
                            <span className="tree-detail-bar-fill" style={{ width: `${row.pct}%` }} />
                          </span>
                          <span className="tree-detail-bar-pct">{row.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="tree-detail-reviews">
                    <h3>What the block says</h3>
                    {reviews.length ? (
                      reviews.map((review) => (
                        <div key={review.id} className="tree-review">
                          <div className="tree-review-head">
                            <strong>{review.name}</strong>
                            <span className="tree-review-stars" aria-label={`${review.stars} out of 5 stars`}>
                              {"★".repeat(review.stars)}
                              <span className="tree-review-stars-empty">{"★".repeat(5 - review.stars)}</span>
                            </span>
                            <span className="tree-review-when">{review.when}</span>
                          </div>
                          <p>{review.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="tree-detail-caption">No public visit notes have been logged for this provider yet.</p>
                    )}
                    <p className="tree-detail-caption">
                      Notes are written in PCT&rsquo;s speculative language of care — imagined, not clinical.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="provider-choose-btn tree-detail-choose"
                    onClick={() => openCardDialog(detailProvider)}
                  >
                    Choose as Primary PCT
                  </button>
                </div>
              </div>
            );
          })()
        : null}

      {cardProvider ? (
        <div
          className="tree-detail-overlay card-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${cardProvider.speciesCommon} PCT provider card`}
          onClick={() => setCardProvider(null)}
        >
          <div className="card-dialog-modal" onClick={(event) => event.stopPropagation()}>
            <div className="card-dialog-header">
              <div>
                <span className="provider-card-eyebrow">
                  Primary PCT · {cardProvider.clinicNeighborhood}
                </span>
                <h2>{cardProvider.speciesCommon} provider card</h2>
              </div>
              <button
                type="button"
                className="tree-detail-close"
                onClick={() => setCardProvider(null)}
                aria-label="Close card"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="card-dialog-body">
              <PctProviderCardSvgPair
                cardIdPrefix={`pct-provider-card-dialog-${cardProvider.providerId}`}
                provider={cardProvider}
                zipcode={zipcode}
              />
            </div>

            <div className="card-dialog-actions">
              {cardDownloadError ? <p role="alert">{cardDownloadError}</p> : null}
              <button type="button" className="tree-learn-more" onClick={() => setCardProvider(null)}>
                Keep browsing
              </button>
              <button
                type="button"
                className="provider-choose-btn"
                onClick={downloadCardPdf}
                disabled={isDownloadingCard}
              >
                <Download aria-hidden="true" size={16} />
                {isDownloadingCard ? "Preparing PDF..." : "Download"}
              </button>
              <button
                type="button"
                className="provider-choose-btn"
                onClick={printCardPdf}
                disabled={isPrintingCard}
              >
                <Printer aria-hidden="true" size={16} />
                {isPrintingCard ? "Preparing print..." : "Print"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
