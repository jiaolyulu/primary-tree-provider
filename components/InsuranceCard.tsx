"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Leaf, MapPin, ShieldCheck } from "lucide-react";
import { ProviderMatch, providerNetworkStats, rankProviders } from "@/lib/providers";

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

  const memberId = `PCT-${String(provider.providerId).slice(-6)}`;
  const groupNumber = `NYC-${provider.clinicZipcode}`;

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
        <article className="insurance-card">
          <div className="insurance-card-top">
            <div className="card-logo-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div>
              <span>Primary Care Trees</span>
              <strong>Canopy Care Plan</strong>
            </div>
          </div>

          <div className="insurance-card-grid">
            <div>
              <span>Member</span>
              <strong>NYC Visitor</strong>
            </div>
            <div>
              <span>Member ID</span>
              <strong>{memberId}</strong>
            </div>
            <div>
              <span>Group</span>
              <strong>{groupNumber}</strong>
            </div>
            <div>
              <span>Copay</span>
              <strong>$0 + water</strong>
            </div>
          </div>

          <div className="card-primary-provider">
            <span>Primary Tree Provider</span>
            <h2>{provider.speciesCommon}</h2>
            <p>
              {provider.clinicName}
              <br />
              {provider.clinicAddress}, {provider.clinicCity}, {provider.clinicState} {provider.clinicZipcode}
            </p>
          </div>

          <div className="insurance-card-footer">
            <div>
              <Leaf aria-hidden="true" size={17} />
              <span>{provider.medicalSpecialty}</span>
            </div>
            <div>
              <MapPin aria-hidden="true" size={17} />
              <span>{provider.distanceLabel}</span>
            </div>
            <div>
              <span>{providerNetworkStats.totalProviders.toLocaleString()} network trees</span>
            </div>
          </div>
        </article>

        <aside className="insurance-card-notes">
          <span>Coverage notes</span>
          <p>{provider.signaturePrescription}</p>
          <dl>
            <div>
              <dt>Eligibility</dt>
              <dd>{symptom || "general care"} near {hasPinnedLocation ? "map pin" : zipcode}</dd>
            </div>
            <div>
              <dt>Visit site</dt>
              <dd>{provider.clinicNeighborhood}</dd>
            </div>
            <div>
              <dt>Appointment rules</dt>
              <dd>No saws. Hydration encouraged. Shade is in network.</dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
