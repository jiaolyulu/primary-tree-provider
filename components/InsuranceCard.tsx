"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ProviderMatch, rankProviders } from "@/lib/providers";

function shortText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function textLines(value: string, maxLength: number, maxLines: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = next;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines.map((line, index) => (index === maxLines - 1 ? shortText(line, maxLength) : line));
}

export function InsuranceCard() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const zipcode = params.get("zip") || "11215";
  const symptom = params.get("symptom")?.trim() || "";
  const providerId = Number(params.get("providerId"));
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));
  const hasPinnedLocation = params.get("location") === "pin" && Number.isFinite(latitude) && Number.isFinite(longitude);
  const [provider, setProvider] = useState<ProviderMatch | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    setProvider(null);
    setLoadError("");

    rankProviders(zipcode, symptom, hasPinnedLocation ? { latitude, longitude } : undefined)
      .then((matches) => {
        if (!isCurrent) return;
        setProvider(matches.find((match) => match.providerId === providerId) || matches[0] || null);
      })
      .catch(() => {
        if (!isCurrent) return;
        setProvider(null);
        setLoadError("We're having trouble loading your selected Primary Care Tree. Please refresh or try again soon.");
      });

    return () => {
      isCurrent = false;
    };
  }, [zipcode, symptom, providerId, hasPinnedLocation, latitude, longitude]);

  const dashboardParams = new URLSearchParams();
  dashboardParams.set("zip", zipcode);
  if (symptom) dashboardParams.set("symptom", symptom);
  if (hasPinnedLocation) {
    dashboardParams.set("location", "pin");
    dashboardParams.set("lat", latitude.toFixed(5));
    dashboardParams.set("lng", longitude.toFixed(5));
  } else {
    dashboardParams.set("location", "zip");
  }

  if (loadError) {
    return (
      <main className="card-page">
        <Link href={`/providers?${dashboardParams.toString()}`} className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          Back to providers
        </Link>
        <section className="card-page-header">
          <div className="eyebrow dark">
            <ShieldCheck aria-hidden="true" size={15} />
            Card temporarily unavailable
          </div>
          <h1>Your card cannot load yet</h1>
          <p>{loadError}</p>
        </section>
      </main>
    );
  }

  if (!provider) {
    return (
      <main className="card-page">
        <Link href={`/providers?${dashboardParams.toString()}`} className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          Back to providers
        </Link>
        <section className="insurance-card-shell loading">
          <div className="insurance-card">
            <span />
            <span />
            <span />
          </div>
        </section>
      </main>
    );
  }

  const doctorId = String(provider.providerId);
  const visitLine = `${provider.clinicAddress}, ${provider.clinicCity}, ${provider.clinicState} ${provider.clinicZipcode}`;
  const primaryProviderLines = textLines(provider.speciesCommon, 26, 2);
  const clinicLines = textLines(provider.clinicName, 34, 2);
  const addressLines = textLines(visitLine, 50, 2);
  const specialtyLines = textLines(provider.medicalSpecialty, 28, 2);
  const conditionLines = textLines(provider.searchableConditions.slice(0, 6).join(" / "), 34, 3);
  const availabilityLabel = provider.weekendAvailability ? "Weekend visits available" : "Weekday visits only";
  const coordinatesLabel = `${provider.clinicLatitude.toFixed(5)}, ${provider.clinicLongitude.toFixed(5)}`;

  return (
    <main className="card-page">
      <Link href={`/providers?${dashboardParams.toString()}`} className="back-link">
        <ArrowLeft aria-hidden="true" size={16} />
        Back to providers
      </Link>

      <section className="card-page-header">
        <div className="eyebrow dark">
          <ShieldCheck aria-hidden="true" size={15} />
          Primary PCT selected
        </div>
        <h1>Your PCT provider card</h1>
        <p>
          A compact card built from the selected NYC tree-provider record and your care search context.
        </p>
      </section>

      <section className="insurance-card-shell" aria-label="Primary Care Trees provider card">
        <div className="insurance-card-pair">
          <article className="insurance-card-panel" aria-label="Primary Care Trees provider card front">
            <span className="insurance-card-side-label">Front</span>
            <svg className="insurance-card-svg" viewBox="0 0 856 540" role="img" aria-labelledby="pct-card-front-title">
              <title id="pct-card-front-title">Primary Care Trees provider card front</title>
              <defs>
                <filter id="pctCardShadow" x="-8%" y="-8%" width="116%" height="116%">
                  <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#063d22" floodOpacity="0.18" />
                </filter>
              </defs>
              <rect x="10" y="10" width="836" height="520" rx="24" fill="#ffffff" filter="url(#pctCardShadow)" />
              <rect x="10" y="10" width="836" height="520" rx="24" fill="none" stroke="#007a34" strokeOpacity="0.36" />

              <g transform="translate(42 44)">
                {[0, 1, 2, 3, 4].map((tree) => (
                  <g key={tree} transform={`translate(${tree * 17} 0)`}>
                    <path d="M8 0 C18 16 19 38 8 48 C-3 38 -2 16 8 0Z" fill="#007a34" />
                    <rect x="6" y="45" width="4" height="22" fill="#007a34" />
                  </g>
                ))}
                <text x="102" y="32" className="svg-card-brand">PrimaryCareTrees</text>
                <text x="104" y="58" className="svg-card-small">NYC Open Data provider card</text>
              </g>

              <text x="42" y="136" className="svg-card-label">Provider ID</text>
              <text x="190" y="136" className="svg-card-number">{doctorId}</text>
              <text x="520" y="136" className="svg-card-label">Search ZIP</text>
              <text x="745" y="136" textAnchor="end" className="svg-card-value">{zipcode}</text>
              <line x1="42" y1="165" x2="814" y2="165" className="svg-card-rule" />

              <text x="42" y="204" className="svg-card-label">Primary Tree Provider</text>
              {primaryProviderLines.map((line, index) => (
                <text key={line} x="42" y={242 + index * 36} className="svg-card-tree">
                  {line}
                </text>
              ))}
              <text x="42" y="322" className="svg-card-body-quiet">{shortText(provider.speciesScientific, 44)}</text>

              <text x="470" y="204" className="svg-card-label">Clinical Specialty</text>
              {specialtyLines.map((line, index) => (
                <text key={line} x="470" y={242 + index * 33} className="svg-card-value">
                  {line}
                </text>
              ))}

              <rect x="42" y="370" width="266" height="86" rx="12" fill="#f3f7f0" stroke="#007a34" strokeOpacity="0.32" />
              <text x="62" y="404" className="svg-card-label">Care rating</text>
              <text x="62" y="438" className="svg-card-value">{provider.careRating.toFixed(1)} / 5</text>

              <rect x="342" y="370" width="472" height="86" rx="12" fill="#f3f7f0" stroke="#007a34" strokeOpacity="0.32" />
              <text x="362" y="404" className="svg-card-label">Availability</text>
              <text x="362" y="438" className="svg-card-body">{availabilityLabel}</text>

              <text x="42" y="505" className="svg-card-small">Distance from search location: {provider.distanceLabel}</text>
              <text x="814" y="505" textAnchor="end" className="svg-card-small">Neighborhood: {shortText(provider.clinicNeighborhood, 30)}</text>
            </svg>
          </article>

          <article className="insurance-card-panel" aria-label="Primary Care Trees provider card back">
            <span className="insurance-card-side-label">Back</span>
            <svg className="insurance-card-svg" viewBox="0 0 856 540" role="img" aria-labelledby="pct-card-back-title">
              <title id="pct-card-back-title">Primary Care Trees provider card back</title>
              <defs>
                <filter id="pctCardBackShadow" x="-8%" y="-8%" width="116%" height="116%">
                  <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#063d22" floodOpacity="0.18" />
                </filter>
              </defs>
              <rect x="10" y="10" width="836" height="520" rx="24" fill="#ffffff" filter="url(#pctCardBackShadow)" />
              <rect x="10" y="10" width="836" height="520" rx="24" fill="none" stroke="#007a34" strokeOpacity="0.36" />

              <g transform="translate(42 44)">
                {[0, 1, 2, 3, 4].map((tree) => (
                  <g key={tree} transform={`translate(${tree * 14} 0)`}>
                    <path d="M7 0 C16 14 17 34 7 43 C-2 34 -2 14 7 0Z" fill="#007a34" />
                    <rect x="5.5" y="40" width="3" height="18" fill="#007a34" />
                  </g>
                ))}
                <text x="92" y="30" className="svg-card-brand">Provider Record</text>
                <text x="94" y="56" className="svg-card-small">Fields shown from selected PCT data</text>
              </g>

              <text x="42" y="140" className="svg-card-label-bold">Visit Site</text>
              {clinicLines.map((line, index) => (
                <text key={line} x="42" y={174 + index * 26} className="svg-card-body">
                  {line}
                </text>
              ))}
              {addressLines.map((line, index) => (
                <text key={line} x="42" y={240 + index * 24} className="svg-card-body-quiet">
                  {line}
                </text>
              ))}
              <text x="42" y="304" className="svg-card-small">Coordinates: {coordinatesLabel}</text>

              <text x="470" y="140" className="svg-card-label-bold">Condition Focus</text>
              {conditionLines.map((line, index) => (
                <text key={line} x="470" y={174 + index * 26} className="svg-card-body">
                  {line}
                </text>
              ))}

              <line x1="42" y1="336" x2="814" y2="336" className="svg-card-rule" />

              <text x="42" y="382" className="svg-card-label-bold">Record Details</text>
              <text x="42" y="416" className="svg-card-body">Provider type: {shortText(provider.providerType, 34)}</text>
              <text x="42" y="448" className="svg-card-body">Experience level: {shortText(provider.treeExperienceLevel, 30)}</text>
              <text x="42" y="480" className="svg-card-body">Years at site: {provider.yearsAtCurrentSpot}</text>

              <text x="470" y="382" className="svg-card-label-bold">Environmental Access</text>
              <text x="470" y="416" className="svg-card-body">Care access score: {provider.careAccessibilityScore.toFixed(1)}</text>
              <text x="470" y="448" className="svg-card-body">Shade-side manner: {provider.shadeSideMannerScore.toFixed(1)}</text>
              <text x="470" y="480" className="svg-card-body">Next visit: {provider.nextAvailableVisitDays} days</text>

              <text x="42" y="510" className="svg-card-small">Experience: {provider.yearsOfPractice} years of practice</text>
              <text x="814" y="510" textAnchor="end" className="svg-card-small">
                Storm response: {provider.stormResponseReadiness}
              </text>
            </svg>
          </article>
        </div>
      </section>
    </main>
  );
}
