"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ProviderMatch, providerNetworkStats, rankProviders } from "@/lib/providers";

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
  const groupNumber = `NYC-${provider.clinicZipcode}`;
  const memberId = `${provider.clinicZipcode}-${doctorId.slice(-4).padStart(4, "0")}`;
  const payerId = `TREE-${provider.clinicZipcode}`;
  const visitLine = `${provider.clinicAddress}, ${provider.clinicCity}, ${provider.clinicState} ${provider.clinicZipcode}`;
  const primaryProviderLines = textLines(provider.speciesCommon, 20, 2);
  const clinicLines = textLines(provider.clinicName, 30, 2);
  const addressLines = textLines(visitLine, 44, 2);
  const prescriptionLines = textLines(provider.signaturePrescription, 54, 3);
  const specialtyLines = textLines(provider.medicalSpecialty, 24, 2);

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
        <h1>Your health insurance card</h1>
        <p>
          This speculative coverage card now names the actual Primary Care Tree selected from the ranked NYC Open Data
          provider network.
        </p>
      </section>

      <section className="insurance-card-shell" aria-label="Primary Care Trees insurance card">
        <div className="insurance-card-pair">
          <article className="insurance-card-panel" aria-label="Primary Care Trees insurance card front">
            <span className="insurance-card-side-label">Front</span>
            <svg className="insurance-card-svg" viewBox="0 0 856 540" role="img" aria-labelledby="pct-card-front-title">
              <title id="pct-card-front-title">Primary Care Trees insurance card front</title>
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
                <text x="104" y="58" className="svg-card-small">Health Plan (80840)</text>
              </g>

              <text x="255" y="122" className="svg-card-number">911-{doctorId.slice(-4).padStart(4, "0")}-04</text>
              <text x="42" y="152" className="svg-card-label">Member ID:</text>
              <text x="180" y="152" className="svg-card-value">{memberId}</text>
              <text x="520" y="152" className="svg-card-label">Group Number:</text>
              <text x="745" y="152" textAnchor="end" className="svg-card-value">{groupNumber}</text>
              <line x1="42" y1="165" x2="814" y2="165" className="svg-card-rule" />

              <text x="42" y="194" className="svg-card-label">Member:</text>
              <text x="42" y="220" className="svg-card-body">NYC VISITOR</text>
              <text x="42" y="246" className="svg-card-label">Primary Tree Provider:</text>
              {primaryProviderLines.map((line, index) => (
                <text key={line} x="42" y={278 + index * 30} className="svg-card-tree">
                  {line}
                </text>
              ))}
              <text x="42" y="348" className="svg-card-body-quiet">{shortText(provider.speciesScientific, 34)}</text>

              <text x="470" y="197" className="svg-card-label">Specialty</text>
              {specialtyLines.map((line, index) => (
                <text key={line} x="470" y={225 + index * 29} className="svg-card-value">
                  {line}
                </text>
              ))}
              <text x="470" y="300" className="svg-card-label">Payer ID {payerId}</text>
              <text x="470" y="330" className="svg-card-label">Visit Site:</text>
              {clinicLines.map((line, index) => (
                <text key={line} x="470" y={356 + index * 22} className="svg-card-body">
                  {line}
                </text>
              ))}
              {addressLines.map((line, index) => (
                <text key={line} x="470" y={404 + index * 22} className="svg-card-body-quiet">
                  {line}
                </text>
              ))}

              <rect x="548" y="230" width="266" height="122" fill="none" stroke="#007a34" strokeWidth="4" />
              <text x="568" y="262" className="svg-card-label">PCT Rx</text>
              <text x="568" y="290" className="svg-card-body">Rx Bin: OXYGEN</text>
              <text x="568" y="316" className="svg-card-body">Rx PCN: H2O</text>
              <text x="568" y="342" className="svg-card-body">Rx Grp: SHADE</text>

              <text x="42" y="430" className="svg-card-small">Copays:</text>
              <text x="42" y="456" className="svg-card-body">Office: $0</text>
              <text x="150" y="456" className="svg-card-body">ER: Compost only</text>
              <text x="42" y="482" className="svg-card-body">Water: encouraged</text>
              <text x="150" y="482" className="svg-card-body">Spec: {shortText(provider.distanceLabel, 18)}</text>
              <text x="42" y="510" className="svg-card-small">0508</text>
              <text x="470" y="482" className="svg-card-plan">Canopy Care Plus</text>
              <text x="470" y="508" className="svg-card-body-quiet">Administered by NYC Open Data Urban Forestry</text>
            </svg>
          </article>

          <article className="insurance-card-panel" aria-label="Primary Care Trees insurance card back">
            <span className="insurance-card-side-label">Back</span>
            <svg className="insurance-card-svg" viewBox="0 0 856 540" role="img" aria-labelledby="pct-card-back-title">
              <title id="pct-card-back-title">Primary Care Trees insurance card back</title>
              <defs>
                <filter id="pctCardBackShadow" x="-8%" y="-8%" width="116%" height="116%">
                  <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#063d22" floodOpacity="0.18" />
                </filter>
              </defs>
              <rect x="10" y="10" width="836" height="520" rx="24" fill="#ffffff" filter="url(#pctCardBackShadow)" />
              <rect x="10" y="10" width="836" height="520" rx="24" fill="none" stroke="#007a34" strokeOpacity="0.36" />

              <text x="782" y="48" textAnchor="end" className="svg-card-small">Printed: 06/11/26</text>

              <text x="42" y="132" className="svg-card-label-bold">Members:</text>
              <text x="162" y="132" className="svg-card-body">We&apos;re here to help. Check shade, find</text>
              <text x="42" y="160" className="svg-card-body">a tree, ask a question and breathe.</text>
              <text x="42" y="202" className="svg-card-label">Web:</text>
              <text x="162" y="202" className="svg-card-body">primary-tree-provider.vercel.app</text>
              <text x="42" y="244" className="svg-card-label">Phone:</text>
              <text x="162" y="244" className="svg-card-body">311-CANOPY</text>

              <line x1="42" y1="282" x2="814" y2="282" className="svg-card-rule" />
              <text x="42" y="310" className="svg-card-label-bold">Providers:</text>
              <text x="162" y="310" className="svg-card-body">{doctorId} or PCT network desk</text>
              <text x="42" y="338" className="svg-card-label">Claims:</text>
              <text x="162" y="338" className="svg-card-body">NYC street tree record, ZIP {provider.clinicZipcode}</text>

              <text x="42" y="392" className="svg-card-label-bold">Coverage notes:</text>
              {prescriptionLines.map((line, index) => (
                <text key={line} x="42" y={424 + index * 26} className="svg-card-body">
                  {line}
                </text>
              ))}

              <text x="42" y="510" className="svg-card-label">Rules:</text>
              <text x="122" y="510" className="svg-card-body">No saws. Hydration encouraged. Shade is in network.</text>
              <text x="782" y="510" textAnchor="end" className="svg-card-small">
                {providerNetworkStats.totalProviders.toLocaleString()} trees
              </text>
            </svg>
          </article>
        </div>
      </section>
    </main>
  );
}
