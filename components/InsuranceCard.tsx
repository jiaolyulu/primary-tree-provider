"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Printer, ShieldCheck } from "lucide-react";
import { downloadProviderCardPdf, printProviderCardPdf, PctProviderCardSvgPair } from "@/components/PctProviderCard";
import { ProviderMatch, rankProviders } from "@/lib/providers";

function queryValues(params: URLSearchParams, name: string) {
  return params
    .getAll(name)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function InsuranceCard() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const zipcode = params.get("zip") || "11215";
  const symptoms = useMemo(() => queryValues(params, "symptom"), [params]);
  const specialties = useMemo(() => queryValues(params, "specialty"), [params]);
  const providerId = Number(params.get("providerId"));
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));
  const hasPinnedLocation = params.get("location") === "pin" && Number.isFinite(latitude) && Number.isFinite(longitude);
  const [provider, setProvider] = useState<ProviderMatch | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [isPrintingCard, setIsPrintingCard] = useState(false);
  const [cardDownloadError, setCardDownloadError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    setProvider(null);
    setLoadError("");

    rankProviders(zipcode, symptoms, hasPinnedLocation ? { latitude, longitude } : undefined, undefined, specialties)
      .then((matches) => {
        if (!isCurrent) return;
        setProvider(matches.find((match) => match.providerId === providerId) || matches[0] || null);
        setCardDownloadError("");
      })
      .catch(() => {
        if (!isCurrent) return;
        setProvider(null);
        setLoadError("We're having trouble loading your selected Primary Care Tree. Please refresh or try again soon.");
      });

    return () => {
      isCurrent = false;
    };
  }, [zipcode, symptoms, specialties, providerId, hasPinnedLocation, latitude, longitude]);

  const dashboardParams = new URLSearchParams();
  dashboardParams.set("zip", zipcode);
  symptoms.forEach((symptom) => dashboardParams.append("symptom", symptom));
  specialties.forEach((specialty) => dashboardParams.append("specialty", specialty));
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

  const downloadCardPdf = async () => {
    if (!provider) return;
    setIsDownloadingCard(true);
    setCardDownloadError("");
    try {
      await downloadProviderCardPdf("pct-provider-card-page", provider);
    } catch {
      setCardDownloadError("We could not prepare the PDF. Please try again.");
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const printCardPdf = async () => {
    if (!provider) return;
    setIsPrintingCard(true);
    setCardDownloadError("");
    try {
      await printProviderCardPdf("pct-provider-card-page");
    } catch {
      setCardDownloadError("We could not prepare the card for printing. Please try again.");
    } finally {
      setIsPrintingCard(false);
    }
  };

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
        <div className="card-page-actions">
          {cardDownloadError ? <p role="alert">{cardDownloadError}</p> : null}
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
      </section>

      <section className="insurance-card-shell" aria-label="Primary Care Tree provider card">
        <PctProviderCardSvgPair cardIdPrefix="pct-provider-card-page" provider={provider} zipcode={zipcode} />
      </section>
    </main>
  );
}
