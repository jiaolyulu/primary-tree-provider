"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronDown, LoaderCircle, MapPin, Stethoscope, X } from "lucide-react";
import { LeafletPinMap } from "@/components/LeafletPinMap";

const symptomGroups = [
  {
    label: "Primary care",
    options: ["annual physical", "cold and flu", "preventive care", "fatigue", "high blood pressure"],
  },
  {
    label: "Mind and sleep",
    options: ["anxiety", "burnout", "insomnia", "stress management", "memory changes", "migraine"],
  },
  {
    label: "Air and allergies",
    options: ["asthma", "chronic cough", "seasonal allergies", "sinus congestion", "hives"],
  },
  {
    label: "Skin and surface",
    options: ["skin rash", "eczema", "dry skin", "sun damage", "mole checks"],
  },
  {
    label: "Movement and aging",
    options: ["fall risk", "mobility changes", "back pain", "joint pain", "knee pain"],
  },
  {
    label: "Metabolic and digestive",
    options: ["diabetes", "prediabetes", "weight changes", "acid reflux", "stomach pain"],
  },
];

const nycMapBounds = {
  west: -74.065,
  south: 40.575,
  east: -73.78,
  north: 40.86,
};

const defaultPin = {
  latitude: 40.7128,
  longitude: -74.006,
};

function getPinFromCoordinates(latitude: number, longitude: number) {
  return {
    latitude: Math.min(nycMapBounds.north, Math.max(nycMapBounds.south, latitude)),
    longitude: Math.min(nycMapBounds.east, Math.max(nycMapBounds.west, longitude)),
  };
}

export function IntakeForm({
  compact = false,
  initialZip = "",
  initialSymptom = "",
  initialLat,
  initialLng,
  initialLocationMode,
}: {
  compact?: boolean;
  initialZip?: string;
  initialSymptom?: string;
  initialLat?: number;
  initialLng?: number;
  initialLocationMode?: "zip" | "pin";
}) {
  const router = useRouter();
  const messageId = useId();
  const pickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasInitialPin = Number.isFinite(initialLat) && Number.isFinite(initialLng);
  const [zipcode, setZipcode] = useState(initialZip);
  const [symptom, setSymptom] = useState(initialSymptom);
  const [formMessage, setFormMessage] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState<"location" | "symptom">("location");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationMode, setLocationMode] = useState<"zip" | "pin">(
    initialLocationMode || (hasInitialPin ? "pin" : "zip"),
  );
  const [pin, setPin] = useState(() =>
    hasInitialPin ? getPinFromCoordinates(initialLat as number, initialLng as number) : defaultPin,
  );
  const [hasChosenPin, setHasChosenPin] = useState(hasInitialPin);
  const hasLocation = locationMode === "pin" ? hasChosenPin : zipcode.trim().length === 5;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isMobileDialogOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileDialogOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileDialogOpen]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isPickerOpen) return;

    const updateMenuPosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuStyle({
        left: rect.left,
        top: rect.bottom + 8,
        width: rect.width,
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isPickerOpen]);

  useEffect(() => {
    setZipcode(initialZip);
    setSymptom(initialSymptom);
    setLocationMode(initialLocationMode || (hasInitialPin ? "pin" : "zip"));
    setPin(hasInitialPin ? getPinFromCoordinates(initialLat as number, initialLng as number) : defaultPin);
    setHasChosenPin(hasInitialPin);
    setFormMessage("");
    setIsSubmitting(false);
    setIsMobileDialogOpen(false);
    setMobileStep("location");
  }, [initialZip, initialSymptom, initialLat, initialLng, initialLocationMode, hasInitialPin]);

  useEffect(() => {
    if (formMessage && hasLocation) {
      setFormMessage("");
    }
  }, [formMessage, hasLocation]);

  function runSearch({ requireSymptom = false } = {}) {
    if (!hasLocation) {
      setIsPickerOpen(false);
      setFormMessage(
        locationMode === "pin" ? "Drop a pin in NYC to find your PCT." : "Enter a 5-digit ZIP code to find your PCT.",
      );
      return;
    }
    if (requireSymptom && !symptom.trim()) {
      setMobileStep("symptom");
      setFormMessage("Select one symptom to find your Primary Care Tree.");
      return;
    }

    setFormMessage("");
    const params = new URLSearchParams();
    if (symptom.trim()) params.set("symptom", symptom.trim());

    if (locationMode === "pin") {
      params.set("location", "pin");
      params.set("lat", pin.latitude.toFixed(5));
      params.set("lng", pin.longitude.toFixed(5));
      params.set("zip", zipcode.trim() || "10014");
    } else {
      params.set("location", "zip");
      params.set("zip", zipcode.trim());
    }

    const targetUrl = `/providers?${params.toString()}`;
    if (typeof window !== "undefined" && `${window.location.pathname}${window.location.search}` === targetUrl) {
      setIsPickerOpen(false);
      setIsMobileDialogOpen(false);
      return;
    }

    setIsPickerOpen(false);
    setIsMobileDialogOpen(false);
    setIsSubmitting(true);
    router.push(targetUrl);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch();
  }

  function selectSymptom(nextSymptom: string) {
    setSymptom(nextSymptom);
    setIsPickerOpen(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  function openMobileDialog() {
    setLocationMode("pin");
    setMobileStep("location");
    setIsPickerOpen(false);
    setFormMessage("");
    setIsMobileDialogOpen(true);
  }

  function continueToMobileSymptoms() {
    if (!hasChosenPin) {
      setFormMessage("Tap the map to select your location first.");
      return;
    }
    setFormMessage("");
    setMobileStep("symptom");
  }

  const symptomMenu =
    isPickerOpen && isClient
      ? createPortal(
          <div ref={menuRef} className="symptom-menu" role="listbox" aria-label="Symptom" style={menuStyle}>
            <button
              type="button"
              className="symptom-any-button"
              role="option"
              aria-selected={!symptom}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                selectSymptom("");
              }}
              onClick={() => selectSymptom("")}
            >
              Any symptom / closest tree
            </button>
            {symptomGroups.map((group) => (
              <div className="symptom-group" key={group.label}>
                <span>{group.label}</span>
                <div>
                  {group.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={symptom === option}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        selectSymptom(option);
                      }}
                      onClick={() => selectSymptom(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  const mobileDialog =
    isMobileDialogOpen && isClient && !compact
      ? createPortal(
          <div className="mobile-intake-overlay" role="dialog" aria-modal="true" aria-label="Find a Primary Care Tree">
            <div className="mobile-intake-dialog">
              <header className="mobile-intake-header">
                <div>
                  <span>{mobileStep === "location" ? "Step 1 of 2" : "Step 2 of 2"}</span>
                  <h2>{mobileStep === "location" ? "Select your location" : "Select one symptom"}</h2>
                </div>
                <button
                  type="button"
                  className="mobile-intake-close"
                  onClick={() => setIsMobileDialogOpen(false)}
                  aria-label="Close"
                >
                  <X aria-hidden="true" size={20} />
                </button>
              </header>

              <div className="mobile-intake-content">
                {mobileStep === "location" ? (
                  <section className="mobile-intake-step" aria-label="Select location">
                    <p>Tap the NYC map to set the location where you want care to begin.</p>
                    <LeafletPinMap
                      pin={pin}
                      showMarker={hasChosenPin}
                      onChange={(nextPin) => {
                        setPin(nextPin);
                        setHasChosenPin(true);
                        setFormMessage("");
                      }}
                    />
                    <p className="mobile-intake-status">
                      {hasChosenPin ? "Location selected." : "No location selected yet."}
                    </p>
                  </section>
                ) : (
                  <section className="mobile-intake-step" aria-label="Select symptom">
                    <p>Choose one symptom so the network can match the right provider tree specialty.</p>
                    <div className="mobile-symptom-list" role="radiogroup" aria-label="Symptoms">
                      {symptomGroups.map((group) => (
                        <div className="mobile-symptom-group" key={group.label}>
                          <span>{group.label}</span>
                          <div>
                            {group.options.map((option) => (
                              <button
                                key={option}
                                type="button"
                                role="radio"
                                aria-checked={symptom === option}
                                onClick={() => {
                                  setSymptom(option);
                                  setFormMessage("");
                                }}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <footer className="mobile-intake-actions">
                {formMessage ? (
                  <p className="mobile-intake-message" id={messageId} role="status" aria-live="polite">
                    {formMessage}
                  </p>
                ) : null}
                <div>
                  {mobileStep === "symptom" ? (
                    <button type="button" className="secondary-button" onClick={() => setMobileStep("location")}>
                      Back
                    </button>
                  ) : null}
                  {mobileStep === "location" ? (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={!hasChosenPin}
                      onClick={continueToMobileSymptoms}
                    >
                      Select this location
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={!symptom.trim() || isSubmitting}
                      onClick={() => runSearch({ requireSymptom: true })}
                    >
                      <span>{isSubmitting ? "Finding PCT" : "Find a PCT"}</span>
                      {isSubmitting ? (
                        <LoaderCircle className="button-spinner" aria-hidden="true" size={18} />
                      ) : (
                        <ArrowRight aria-hidden="true" size={18} />
                      )}
                    </button>
                  )}
                </div>
              </footer>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {!compact ? (
        <button type="button" className="mobile-intake-launcher" onClick={openMobileDialog}>
          <span>
            <MapPin aria-hidden="true" size={17} />
            Location
          </span>
          <strong>{hasChosenPin ? "Pin selected" : "Tap to choose"}</strong>
          <span>
            <Stethoscope aria-hidden="true" size={17} />
            Symptom
          </span>
          <strong>{symptom || "Required"}</strong>
        </button>
      ) : null}
      {mobileDialog}
      <form
        className={compact ? "intake-form compact" : "intake-form intake-form-desktop"}
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
        aria-describedby={formMessage ? messageId : undefined}
        noValidate
      >
      <div className="location-mode-toggle" aria-label="Location input mode">
        <button
          type="button"
          aria-pressed={locationMode === "zip"}
          onClick={() => {
            setLocationMode("zip");
            setFormMessage("");
          }}
        >
          ZIP code
        </button>
        <button
          type="button"
          aria-pressed={locationMode === "pin"}
          onClick={() => {
            setLocationMode("pin");
            setFormMessage("");
          }}
        >
          Drop pin
        </button>
      </div>

      {locationMode === "zip" ? (
        <label>
          <span>ZIP code</span>
          <div className="field-wrap">
            <MapPin aria-hidden="true" size={18} />
            <input
              inputMode="numeric"
              maxLength={5}
              placeholder="11215"
              required={locationMode === "zip"}
              value={zipcode}
              aria-invalid={locationMode === "zip" && Boolean(formMessage) ? true : undefined}
              aria-describedby={locationMode === "zip" && formMessage ? messageId : undefined}
              onChange={(event) => {
                setZipcode(event.target.value);
                if (formMessage) setFormMessage("");
              }}
            />
          </div>
        </label>
      ) : (
        <div className="pin-map-field">
          <span>Drop a pin in NYC</span>
          <LeafletPinMap
            pin={pin}
            showMarker={hasChosenPin}
            onChange={(nextPin) => {
              setPin(nextPin);
              setHasChosenPin(true);
              setFormMessage("");
            }}
          />
          <p>
            Scroll or use map controls to zoom. Click the map to set the required location.
            {hasChosenPin ? " Pin selected." : ""}
          </p>
        </div>
      )}

      <div className="intake-field">
        <span>Symptom</span>
        <div className="symptom-picker" ref={pickerRef}>
          <button
            ref={triggerRef}
            type="button"
            className="field-wrap symptom-trigger"
            aria-expanded={isPickerOpen}
            aria-haspopup="listbox"
            onClick={() => setIsPickerOpen((open) => !open)}
          >
            <Stethoscope aria-hidden="true" size={18} />
            <span className={symptom ? "" : "placeholder"}>{symptom || "Any symptom"}</span>
            <ChevronDown aria-hidden="true" size={17} />
          </button>
          {symptomMenu}
        </div>
      </div>
      <button type="submit" className="primary-button" disabled={isSubmitting}>
        <span>{isSubmitting ? "Finding PCT" : "Find a PCT"}</span>
        {isSubmitting ? (
          <LoaderCircle className="button-spinner" aria-hidden="true" size={18} />
        ) : (
          <ArrowRight aria-hidden="true" size={18} />
        )}
      </button>
      {formMessage ? (
        <p className="form-info" id={messageId} role="status" aria-live="polite">
          {formMessage}
        </p>
      ) : null}
      </form>
    </>
  );
}
