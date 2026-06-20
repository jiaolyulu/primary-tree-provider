"use client";

import { useEffect, useState } from "react";
import { Download, Printer, X } from "lucide-react";
import { downloadProviderCardPdf, printProviderCardPdf, PctProviderCardSvgPair } from "@/components/PctProviderCard";
import type { ProviderMatch } from "@/lib/providers";

const MIDDLE_DOT = "\u00b7";

export function ProviderCardDialog({
  provider,
  zipcode,
  onClose,
}: {
  provider: ProviderMatch;
  zipcode: string;
  onClose: () => void;
}) {
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [isPrintingCard, setIsPrintingCard] = useState(false);
  const [cardDownloadError, setCardDownloadError] = useState("");
  const cardIdPrefix = `pct-provider-card-dialog-${provider.providerId}`;

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

  const downloadCardPdf = async () => {
    setIsDownloadingCard(true);
    setCardDownloadError("");
    try {
      await downloadProviderCardPdf(cardIdPrefix, provider);
    } catch {
      setCardDownloadError("We could not prepare the PDF. Please try again.");
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const printCardPdf = async () => {
    setIsPrintingCard(true);
    setCardDownloadError("");
    try {
      await printProviderCardPdf(cardIdPrefix);
    } catch {
      setCardDownloadError("We could not prepare the card for printing. Please try again.");
    } finally {
      setIsPrintingCard(false);
    }
  };

  return (
    <div
      className="tree-detail-overlay card-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${provider.speciesCommon} PCT provider card`}
      onClick={onClose}
    >
      <div className="card-dialog-modal" onClick={(event) => event.stopPropagation()}>
        <div className="card-dialog-header">
          <div>
            <span className="provider-card-eyebrow">
              Primary PCT {MIDDLE_DOT} {provider.clinicNeighborhood}
            </span>
            <h2>{provider.speciesCommon} provider card</h2>
          </div>
          <button type="button" className="tree-detail-close" onClick={onClose} aria-label="Close card">
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="card-dialog-body">
          <PctProviderCardSvgPair cardIdPrefix={cardIdPrefix} provider={provider} zipcode={zipcode} />
        </div>

        <div className="card-dialog-actions">
          {cardDownloadError ? <p role="alert">{cardDownloadError}</p> : null}
          <button type="button" className="tree-learn-more" onClick={onClose}>
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
          <button type="button" className="provider-choose-btn" onClick={printCardPdf} disabled={isPrintingCard}>
            <Printer aria-hidden="true" size={16} />
            {isPrintingCard ? "Preparing print..." : "Print"}
          </button>
        </div>
      </div>
    </div>
  );
}
