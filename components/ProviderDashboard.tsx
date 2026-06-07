"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Apple,
  ArrowLeft,
  ArrowRight,
  Baby,
  Bone,
  Brain,
  ClipboardCheck,
  Droplet,
  Ear,
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
  X,
  Zap,
} from "lucide-react";
import { IntakeForm } from "@/components/IntakeForm";
import { ProviderResultsMap } from "@/components/ProviderResultsMap";
import { ProviderMatch, providerNetworkStats, rankProviders } from "@/lib/providers";

function providerTreeImage(provider: ProviderMatch) {
  const species = provider.speciesCommon.toLowerCase();
  if (species.includes("linden")) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Tilia%20cordata%20-%20%27Greenspire%27%20littleleaf%20linden.jpg?width=500";
  }
  if (species.includes("ginkgo")) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Ginkgo-biloba-tree-in-fall.jpg?width=500";
  }
  if (species.includes("sophora") || species.includes("pagoda")) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/20120905Styphnolobium%20japonicum.jpg?width=500";
  }
  if (species.includes("oak")) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Pin%20oak%20quercus%20palustris.jpg?width=500";
  }
  if (species.includes("zelkova")) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Zelkova%20serrata%20entire.jpg?width=500";
  }
  if (species.includes("sweetgum")) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/E20151113-0001%E2%80%94Liquidambar%20styraciflua%E2%80%94Berkelely%20%2822378349813%29.jpg?width=500";
  }
  if (species.includes("lilac")) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Syringa%20reticulata%20tree.jpg?width=500";
  }
  return "/images/pct-tree-hero.jpg";
}

function providerCardBio(provider: ProviderMatch) {
  return provider.providerBio.replace(/^At [^,]+, /, "");
}

function titleCaseAddress(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

// Cache resolved species photos so we fetch Wikipedia once per scientific name.
const speciesImageCache = new Map<string, string>();

function TreeImage({ provider, className }: { provider: ProviderMatch; className: string }) {
  const fallback = providerTreeImage(provider);
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
  // Rough arborist-style estimate: trunk diameter (real census data) x growth factor.
  return Math.max(3, Math.round(provider.treeDbh * 2.5));
}

const openHoursOptions = [
  "Dawn–dusk",
  "Sunup to sundown",
  "Always (it's a tree)",
  "Whenever you need shade",
];

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
  "Came in for {condition}. The {species} didn't rush me — just offered shade and let the {hood} block slow down until I could think.",
  "Five stars. Prescribed 'one slower block' and somehow that worked better than the last three apps on my phone.",
  "I keep coming back. This {species} treats the sidewalk like a waiting room and it actually helps.",
  "Skeptical at first, but the canopy runs on time. {hood} is lucky to have it.",
  "Best {specialty} on the block. No paperwork, just shade, weather, and a little patience.",
  "The {species} made my {condition} feel less like a mystery and more like something the street had been tracking all along.",
  "Quiet, steady, a little drippy after rain. Would shelter under again.",
  "Came for the shade, stayed for the perspective. Would reroute my commute past it.",
  "Gave me a bench, a breeze, and zero judgment. The {hood} regulars know.",
  "Not the flashiest tree, but it remembers the block better than I do.",
];

function generateReviews(provider: ProviderMatch) {
  const seed = String(provider.providerId);
  const count = 3 + (seededHash(`${seed}:count`) % 2);
  const condition = provider.searchableConditions[0] ?? "general care";
  // Rotate through each pool from a seeded start so names and templates stay
  // distinct within a single tree's review list.
  const nameStart = seededHash(`${seed}:name`) % reviewerNames.length;
  const dateStart = seededHash(`${seed}:date`) % reviewDates.length;
  const templateStart = seededHash(`${seed}:tpl`) % reviewTemplates.length;
  return Array.from({ length: count }, (_, index) => {
    const text = reviewTemplates[(templateStart + index) % reviewTemplates.length]
      .split("{species}").join(provider.speciesCommon)
      .split("{hood}").join(provider.clinicNeighborhood)
      .split("{condition}").join(condition)
      .split("{specialty}").join(provider.medicalSpecialty.toLowerCase());
    return {
      id: index,
      name: reviewerNames[(nameStart + index) % reviewerNames.length],
      when: reviewDates[(dateStart + index * 2) % reviewDates.length],
      stars: seededPick([5, 5, 5, 4, 4, 3], seed, index * 7 + 1),
      text,
    };
  });
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
  const originLabel = hasPinnedLocation ? "your dropped pin" : zipcode;
  const [rankedProviders, setRankedProviders] = useState<ProviderMatch[] | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [detailProvider, setDetailProvider] = useState<ProviderMatch | null>(null);

  useEffect(() => {
    if (!detailProvider) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailProvider(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [detailProvider]);

  useEffect(() => {
    let isCurrent = true;
    setRankedProviders(null);

    rankProviders(zipcode, symptom, hasPinnedLocation ? { latitude, longitude } : undefined).then((matches) => {
      if (!isCurrent) return;
      setRankedProviders(matches);
      setSelectedProviderId(matches[0]?.providerId ?? null);
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

  const buildCardUrl = (providerId: number) => {
    const cardParams = new URLSearchParams();
    cardParams.set("zip", zipcode);
    cardParams.set("providerId", String(providerId));
    if (symptom) cardParams.set("symptom", symptom);
    if (hasPinnedLocation) {
      cardParams.set("location", "pin");
      cardParams.set("lat", latitude.toFixed(5));
      cardParams.set("lng", longitude.toFixed(5));
    } else {
      cardParams.set("location", "zip");
    }
    return `/card?${cardParams.toString()}`;
  };

  if (!rankedProviders?.length) {
    return (
      <main className="provider-search-page">
        <header className="provider-search-topbar">
          <Link href="/" className="back-link provider-back-link">
            <ArrowLeft aria-hidden="true" size={16} />
            Landing page
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

  const nearbyProviders = rankedProviders.slice(0, 100);
  const displayedProviders = rankedProviders.slice(0, 8);
  const selectedProvider =
    displayedProviders.find((provider) => provider.providerId === selectedProviderId) || displayedProviders[0];
  const averageWait = Math.round(
    nearbyProviders.reduce((total, provider) => total + provider.nextAvailableVisitDays, 0) / nearbyProviders.length,
  );
  const averageAccess = Math.round(
    nearbyProviders.reduce((total, provider) => total + provider.careAccessibilityScore, 0) / nearbyProviders.length,
  );
  const starProviders = nearbyProviders.filter((provider) => provider.starDoctor).length;
  const selectedLatitude = selectedProvider.clinicLatitude;
  const selectedLongitude = selectedProvider.clinicLongitude;

  return (
    <main className="provider-search-page">
      <header className="provider-search-topbar">
        <Link href="/" className="back-link provider-back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          Landing page
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
        <div className="provider-summary-stats">
          <span>{providerNetworkStats.totalProviders.toLocaleString()} NYC providers</span>
          <span>{starProviders} nearby stars</span>
          <span>{averageWait}d avg wait</span>
          <span>{averageAccess} avg access</span>
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
            <div className="map-coordinate-card">
              <MapPin aria-hidden="true" size={16} />
              <span>
                {selectedLatitude.toFixed(4)}, {selectedLongitude.toFixed(4)}
              </span>
            </div>
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
                        <span>({provider.reviewCount} reviews)</span>
                      </div>
                      <address>
                        {titleCaseAddress(provider.clinicAddress)}, {provider.clinicCity}, {provider.clinicState}{" "}
                        {provider.clinicZipcode}
                      </address>
                      <p className="provider-card-bio">{providerCardBio(provider)}</p>
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
                    <button
                      type="button"
                      className="tree-learn-more"
                      onClick={() => setDetailProvider(provider)}
                    >
                      Learn more
                    </button>
                    <Link href={buildCardUrl(provider.providerId)} className="provider-choose-btn">
                      Choose as Primary PCT
                      <ArrowRight aria-hidden="true" size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      {detailProvider
        ? (() => {
            const reviews = generateReviews(detailProvider);
            const breakdown = ratingBreakdown(detailProvider);
            const tiles = [
              { label: "On the block", value: `~${estimatedTreeAge(detailProvider)} yrs` },
              { label: "Trunk width", value: `${detailProvider.treeDbh}″` },
              { label: "Tree health", value: detailProvider.treeHealth || "Unlogged" },
              {
                label: "Open hours",
                value: seededPick(openHoursOptions, String(detailProvider.providerId), 99),
              },
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
                        <span>({detailProvider.reviewCount} reviews)</span>
                      </div>
                      <p className="tree-detail-address">
                        {titleCaseAddress(detailProvider.clinicAddress)}, {detailProvider.clinicCity},{" "}
                        {detailProvider.clinicState} {detailProvider.clinicZipcode}
                      </p>
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
                  <p className="tree-detail-tiles-note">
                    Trunk width and health are real NYC street-tree census data; age is estimated from trunk
                    width.
                  </p>

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
                    {reviews.map((review) => (
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
                    ))}
                    <p className="tree-detail-caption">
                      Notes are written in PCT&rsquo;s speculative language of care — imagined, not clinical.
                    </p>
                  </div>

                  <Link
                    href={buildCardUrl(detailProvider.providerId)}
                    className="provider-choose-btn tree-detail-choose"
                  >
                    Choose as Primary PCT
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </div>
              </div>
            );
          })()
        : null}
    </main>
  );
}
