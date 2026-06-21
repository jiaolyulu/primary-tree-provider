"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronDown, LoaderCircle, MapPin, Stethoscope, X } from "lucide-react";
import { LeafletPinMap } from "@/components/LeafletPinMap";
import { careTaxonomy } from "@/lib/careTaxonomy";

type SymptomOption = {
  condition: string;
  specialty: string;
};

const displayedConditionsBySpecialty: Record<string, string[]> = {
  "Allergy and Immunology": ["seasonal allergies", "food allergies"],
  Pulmonology: ["asthma", "chronic cough", "shortness of breath"],
  "Infectious Disease": ["fever evaluation"],
  "ENT / Otolaryngology": ["sinus infection", "sore throat"],
  "Emergency Medicine": ["minor injuries", "urgent symptoms"],
  Cardiology: ["high blood pressure", "chest pain"],
  Hematology: ["anemia", "easy bruising"],
  "Vascular Medicine": ["leg swelling", "varicose veins"],
  Endocrinology: ["diabetes", "thyroid disorder"],
  "Nutrition and Weight Management": ["weight changes", "prediabetes nutrition"],
  Gastroenterology: ["acid reflux", "stomach pain"],
  Neurology: ["migraine", "headache"],
  Psychiatry: ["anxiety", "depression"],
  "Sleep Medicine": ["insomnia", "sleep apnea"],
  Orthopedics: ["back pain", "joint injury"],
  Rheumatology: ["arthritis", "joint pain"],
  "Pain Management": ["chronic pain", "neck pain"],
  "Sports Medicine": ["knee pain", "sprains"],
  "Occupational Medicine": ["work injury", "ergonomic strain"],
  Geriatrics: ["fall risk", "memory concerns"],
  "Family Medicine": ["cold and flu", "annual physical"],
  "Internal Medicine": ["fatigue", "medication review"],
  Pediatrics: ["childhood fever", "school physicals"],
  "Preventive Medicine": ["annual screenings"],
  "Women's Health": ["menstrual concerns", "menopause symptoms"],
  Dermatology: ["eczema", "acne"],
  Ophthalmology: ["vision changes", "dry eyes"],
  Nephrology: ["kidney disease"],
  Urology: ["urinary tract infection", "kidney stones"],
  Oncology: ["lump evaluation", "cancer screening"],
};

const symptomGroups = careTaxonomy.map((group) => ({
  label: group.category,
  options: group.specialties.flatMap((entry) => {
    const displayedConditions = displayedConditionsBySpecialty[entry.specialty] ?? [entry.conditions[0]];
    const validConditions = displayedConditions.filter((condition) => entry.conditions.includes(condition));
    const conditions = validConditions.length ? validConditions : [entry.conditions[0]];
    return conditions.map((condition) => ({
      condition,
      specialty: entry.specialty,
    }));
  }),
}));

function findSymptomOption(condition: string, specialty: string): SymptomOption | null {
  const normalizedCondition = condition.trim().toLowerCase();
  const normalizedSpecialty = specialty.trim().toLowerCase();
  if (!normalizedCondition) return null;

  return (
    symptomGroups
      .flatMap((group) => group.options)
      .find(
        (option) =>
          option.condition.toLowerCase() === normalizedCondition &&
          (!normalizedSpecialty || option.specialty.toLowerCase() === normalizedSpecialty),
      ) ?? null
  );
}

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
  initialSpecialty = "",
}: {
  compact?: boolean;
  initialZip?: string;
  initialSymptom?: string;
  initialLat?: number;
  initialLng?: number;
  initialLocationMode?: "zip" | "pin";
  initialSpecialty?: string;
}) {
  const router = useRouter();
  const messageId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasInitialPin = Number.isFinite(initialLat) && Number.isFinite(initialLng);
  const initialSymptomOption = findSymptomOption(initialSymptom, initialSpecialty);
  const [zipcode, setZipcode] = useState(initialZip);
  const [symptom, setSymptom] = useState(initialSymptom);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSymptomOption?.specialty ?? initialSpecialty);
  const [formMessage, setFormMessage] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState<"location" | "symptom">("location");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({ visibility: "hidden" });
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

    function updateMenuPosition() {
      const anchor =
        (pickerRef.current?.closest(".intake-search-panel") as HTMLElement | null) ?? formRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const panelWidth = rect.width;
      const viewportWidth = window.innerWidth;
      const spaceRight = viewportWidth - rect.right;
      const spaceLeft = rect.left;
      const opensRight = spaceRight >= panelWidth || spaceRight >= spaceLeft;
      const left = opensRight
        ? rect.right - 1
        : Math.max(12, rect.left - panelWidth + 1);

      setMenuStyle({
        height: rect.height,
        left,
        top: rect.top,
        visibility: "visible",
        width: panelWidth,
      });
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPickerOpen(false);
    };
    const resizeObserver = new ResizeObserver(updateMenuPosition);
    const anchor = (pickerRef.current?.closest(".intake-search-panel") as HTMLElement | null) ?? formRef.current;

    updateMenuPosition();
    if (anchor) resizeObserver.observe(anchor);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isPickerOpen, locationMode]);

  useEffect(() => {
    setZipcode(initialZip);
    setSymptom(initialSymptom);
    setSelectedSpecialty(findSymptomOption(initialSymptom, initialSpecialty)?.specialty ?? initialSpecialty);
    setLocationMode(initialLocationMode || (hasInitialPin ? "pin" : "zip"));
    setPin(hasInitialPin ? getPinFromCoordinates(initialLat as number, initialLng as number) : defaultPin);
    setHasChosenPin(hasInitialPin);
    setFormMessage("");
    setIsSubmitting(false);
    setIsMobileDialogOpen(false);
    setMobileStep("location");
  }, [initialZip, initialSymptom, initialLat, initialLng, initialLocationMode, initialSpecialty, hasInitialPin]);

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
    if (symptom.trim() && selectedSpecialty.trim()) params.set("specialty", selectedSpecialty.trim());

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

  function selectSymptom(option: SymptomOption | null) {
    setSymptom(option?.condition ?? "");
    setSelectedSpecialty(option?.specialty ?? "");
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
          <div ref={menuRef} className="symptom-menu" role="dialog" aria-label="Symptom choices" style={menuStyle}>
            <div className="symptom-menu-header">
              <span>Symptoms</span>
              <button type="button" onClick={() => setIsPickerOpen(false)} aria-label="Close symptom choices">
                <X aria-hidden="true" size={17} />
              </button>
            </div>
            <div role="listbox" aria-label="Symptoms">
              <button
                type="button"
                className="symptom-any-button"
                role="option"
                aria-selected={!symptom}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectSymptom(null);
                }}
                onClick={() => selectSymptom(null)}
              >
                Any symptom / closest tree
              </button>
              {symptomGroups.map((group) => (
                <div className="symptom-group" key={group.label}>
                  <span>{group.label}</span>
                  <div>
                    {group.options.map((option) => (
                      <button
                        key={`${option.specialty}-${option.condition}`}
                        type="button"
                        role="option"
                        aria-selected={symptom === option.condition && selectedSpecialty === option.specialty}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          selectSymptom(option);
                        }}
                        onClick={() => selectSymptom(option)}
                      >
                        {option.condition}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
                                key={`${option.specialty}-${option.condition}`}
                                type="button"
                                role="radio"
                                aria-checked={symptom === option.condition && selectedSpecialty === option.specialty}
                                onClick={() => {
                                  setSymptom(option.condition);
                                  setSelectedSpecialty(option.specialty);
                                  setFormMessage("");
                                }}
                              >
                                {option.condition}
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
        ref={formRef}
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
            type="button"
            className="field-wrap symptom-trigger"
            aria-expanded={isPickerOpen}
            aria-haspopup="dialog"
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
