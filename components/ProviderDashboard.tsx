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
  CalendarDays,
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
  Navigation,
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
import { ProviderResultsMap } from "@/components/ProviderResultsMap";
import { ProviderMatch, providerNetworkStats, rankProviders } from "@/lib/providers";

function providerMapsUrl(provider: ProviderMatch) {
  return `https://www.google.com/maps/search/?api=1&query=${provider.clinicLatitude}%2C${provider.clinicLongitude}`;
}

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
                      <img
                        className="provider-tree-avatar"
                        src={providerTreeImage(provider)}
                        alt={`${provider.speciesCommon} tree`}
                        loading="lazy"
                      />
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
    </main>
  );
}
