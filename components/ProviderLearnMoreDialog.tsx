"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Star, X } from "lucide-react";
import type { ProviderMatch } from "@/lib/providers";
import { getTreeImageForProvider } from "@/lib/treeImageSources";

const MIDDLE_DOT = "\u00b7";
const EM_DASH = "\u2014";
const FILLED_STAR = "\u2605";

function titleCaseAddress(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function googleMapsCoordinateUrl(provider: ProviderMatch) {
  return `https://www.google.com/maps/search/?api=1&query=${provider.clinicLatitude.toFixed(6)},${provider.clinicLongitude.toFixed(6)}`;
}

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

  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt={`${provider.speciesCommon} tree`} loading="lazy" />;
}

function estimatedTreeAge(provider: ProviderMatch) {
  return provider.yearsOfPractice;
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
  `Came in for {condition}. The {species} actually treated it ${EM_DASH} a {specialty} plan I could keep up with, and it eased within a couple weeks.`,
  "I'd bounced between clinics for {condition}. This {species} handled the {specialty} side patiently and it finally made sense.",
  "Best {specialty} care on the block. They pinned down what was driving my {condition} and gave me one simple thing to do.",
  `Skeptical a tree could help my {condition}, but the {specialty} treatment was the real deal ${EM_DASH} flare-ups way down.`,
  "Came for {condition}, left understanding it. The {species} explained the {specialty} part without rushing or scaring me.",
  "My {condition} is finally manageable. Whatever this {species} does for {specialty}, it works.",
  "Direct, specific {specialty}. Took my {condition} seriously, never alarmist, and the follow-up actually helped.",
  "Referred here for {condition} and stayed. This {species} treats {specialty} like it matters.",
  "Five stars for {specialty}. The {species} caught my {condition} early and the plan was easy to stick to.",
  "Years of {condition} and no one connected the dots until this {species}. Genuinely good {specialty} care.",
  `Gentle but thorough on my {condition} ${EM_DASH} the kind of {specialty} attention you don't get in a ten-minute visit.`,
  "Whole family sees this {species} now: my {condition} and my partner's {condition2} handled with the same calm {specialty} approach.",
  "Came in stressed about {condition}. Left with a clear {specialty} plan and a lot less worry.",
  `The only provider who made progress on my {condition}. Real {specialty}, no gimmicks ${EM_DASH} just steady {species} care.`,
];

function generateReviews(provider: ProviderMatch) {
  const seed = String(provider.providerId);
  const count = Math.max(0, Math.min(provider.reviewCount, 4));
  const conditions = provider.searchableConditions.length ? provider.searchableConditions : ["the symptom"];
  const specialty = provider.medicalSpecialty.toLowerCase();
  const nameStart = seededHash(`${seed}:name`) % reviewerNames.length;
  const dateStart = seededHash(`${seed}:date`) % reviewDates.length;
  const templateStart = seededHash(`${seed}:tpl`) % reviewTemplates.length;
  const condStart = seededHash(`${seed}:cond`) % conditions.length;

  return Array.from({ length: count }, (_, index) => {
    const condition = conditions[(condStart + index) % conditions.length];
    const condition2 = conditions[(condStart + index + 1) % conditions.length];
    const text = reviewTemplates[(templateStart + index) % reviewTemplates.length]
      .split("{species}")
      .join(provider.speciesCommon)
      .split("{hood}")
      .join(provider.clinicNeighborhood)
      .split("{condition2}")
      .join(condition2)
      .split("{condition}")
      .join(condition)
      .split("{specialty}")
      .join(specialty);

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

export function ProviderLearnMoreDialog({
  provider,
  onClose,
  onChoose,
}: {
  provider: ProviderMatch;
  onClose: () => void;
  onChoose?: (provider: ProviderMatch) => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const reviews = generateReviews(provider);
  const breakdown = ratingBreakdown(provider);
  const tiles = [
    { label: "Doctor ID", value: String(provider.providerId) },
    { label: "Years of experience", value: `~${estimatedTreeAge(provider)} yrs` },
    { label: "Clinic environment", value: provider.waitingRoomFeature },
    { label: "Shade-side manner", value: provider.shadeSideMannerScore.toFixed(1) },
    { label: "Open hours", value: openHoursLabel(provider) },
  ];

  return (
    <div
      className="tree-detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${provider.speciesCommon} details`}
      onClick={onClose}
    >
      <div className="tree-detail-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="tree-detail-close" onClick={onClose} aria-label="Close">
          <X aria-hidden="true" size={18} />
        </button>

        <div className="tree-detail-head">
          <TreeImage provider={provider} className="tree-detail-photo" />
          <div>
            <span className="provider-card-eyebrow">
              {provider.medicalSpecialty} {MIDDLE_DOT} {provider.clinicNeighborhood}
            </span>
            <h2>{provider.speciesCommon}</h2>
            <div className="provider-rating">
              <Star aria-hidden="true" size={15} />
              <strong>{provider.careRating.toFixed(1)}</strong>
              <span>({reviewCountLabel(provider.reviewCount)})</span>
            </div>
            <p className="tree-detail-address">
              {titleCaseAddress(provider.clinicAddress)}, {provider.clinicCity}, {provider.clinicState}{" "}
              {provider.clinicZipcode}
            </p>
            <a className="tree-detail-map-link" href={googleMapsCoordinateUrl(provider)} target="_blank" rel="noreferrer">
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

        <blockquote className="tree-detail-prescription">{provider.signaturePrescription}</blockquote>

        <p className="tree-detail-philosophy">{provider.carePhilosophy}</p>

        <div className="tree-detail-ratings">
          <div className="tree-detail-score">
            <strong>{provider.careRating.toFixed(1)}</strong>
            <span>out of 5</span>
          </div>
          <div className="tree-detail-bars">
            {breakdown.map((row) => (
              <div key={row.star} className="tree-detail-bar-row">
                <span className="tree-detail-bar-label">
                  {row.star}
                  {FILLED_STAR}
                </span>
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
                    {FILLED_STAR.repeat(review.stars)}
                    <span className="tree-review-stars-empty">{FILLED_STAR.repeat(5 - review.stars)}</span>
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
            Notes are written in PCT&rsquo;s speculative language of care &mdash; imagined, not clinical.
          </p>
        </div>

        {onChoose ? (
          <button type="button" className="provider-choose-btn tree-detail-choose" onClick={() => onChoose(provider)}>
            Choose as Primary PCT
          </button>
        ) : null}
      </div>
    </div>
  );
}
