"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PctProviderCardSvgPair } from "@/components/PctProviderCard";
import { ProviderMatch, rankProviders } from "@/lib/providers";

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
        <p>A compact card built from the selected NYC tree-provider record and your care search context.</p>
      </section>

      <section className="insurance-card-shell" aria-label="Primary Care Trees provider card">
        <PctProviderCardSvgPair cardIdPrefix="pct-provider-card-page" provider={provider} zipcode={zipcode} />
      </section>
    </main>
  );
}
