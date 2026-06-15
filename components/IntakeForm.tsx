"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronDown, LoaderCircle, MapPin, Stethoscope } from "lucide-react";
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
  }, [initialZip, initialSymptom, initialLat, initialLng, initialLocationMode, hasInitialPin]);

  useEffect(() => {
    if (formMessage && hasLocation) {
      setFormMessage("");
    }
  }, [formMessage, hasLocation]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasLocation) {
      setIsPickerOpen(false);
      setFormMessage(
        locationMode === "pin" ? "Drop a pin in NYC to find your PCT." : "Enter a 5-digit ZIP code to find your PCT.",
      );
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
      return;
    }

    setIsPickerOpen(false);
    setIsSubmitting(true);
    router.push(targetUrl);
  }

  function selectSymptom(nextSymptom: string) {
    setSymptom(nextSymptom);
    setIsPickerOpen(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
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

  return (
    <form
      className={compact ? "intake-form compact" : "intake-form"}
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
            onChange={(nextPin) => {
              setPin(nextPin);
              setHasChosenPin(true);
              setFormMessage("");
            }}
          />
          <p>
            Scroll or use map controls to zoom. Click the map to set the required location.
            {hasChosenPin ? ` Pin set at ${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}` : ""}
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
  );
}
