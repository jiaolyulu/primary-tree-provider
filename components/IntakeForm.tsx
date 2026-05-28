"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowRight, ChevronDown, LocateFixed, MapPin, Minus, Plus, Stethoscope } from "lucide-react";

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

const mapZoomLevels = [
  { label: "City", latitudeSpan: nycMapBounds.north - nycMapBounds.south, longitudeSpan: nycMapBounds.east - nycMapBounds.west },
  { label: "Area", latitudeSpan: 0.13, longitudeSpan: 0.13 },
  { label: "Street", latitudeSpan: 0.045, longitudeSpan: 0.045 },
];

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

function getMapBounds(center: typeof defaultPin, zoomIndex: number) {
  if (zoomIndex === 0) return nycMapBounds;

  const zoom = mapZoomLevels[zoomIndex];
  const halfLatitude = zoom.latitudeSpan / 2;
  const halfLongitude = zoom.longitudeSpan / 2;
  const latitudeCenter = Math.min(
    nycMapBounds.north - halfLatitude,
    Math.max(nycMapBounds.south + halfLatitude, center.latitude),
  );
  const longitudeCenter = Math.min(
    nycMapBounds.east - halfLongitude,
    Math.max(nycMapBounds.west + halfLongitude, center.longitude),
  );

  return {
    west: longitudeCenter - halfLongitude,
    south: latitudeCenter - halfLatitude,
    east: longitudeCenter + halfLongitude,
    north: latitudeCenter + halfLatitude,
  };
}

function getPinPosition(pin: typeof defaultPin, bounds: typeof nycMapBounds) {
  const xPercent = ((pin.longitude - bounds.west) / (bounds.east - bounds.west)) * 100;
  const yPercent = ((bounds.north - pin.latitude) / (bounds.north - bounds.south)) * 100;

  return {
    xPercent: Math.min(96, Math.max(4, xPercent)),
    yPercent: Math.min(96, Math.max(4, yPercent)),
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
  const pickerRef = useRef<HTMLDivElement>(null);
  const lastWheelZoomAtRef = useRef(0);
  const hasInitialPin = Number.isFinite(initialLat) && Number.isFinite(initialLng);
  const [zipcode, setZipcode] = useState(initialZip);
  const [symptom, setSymptom] = useState(initialSymptom);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [locationMode, setLocationMode] = useState<"zip" | "pin">(
    initialLocationMode || (hasInitialPin ? "pin" : "zip"),
  );
  const [mapZoomIndex, setMapZoomIndex] = useState(0);
  const [pin, setPin] = useState(() =>
    hasInitialPin ? getPinFromCoordinates(initialLat as number, initialLng as number) : defaultPin,
  );
  const activeMapBounds = getMapBounds(pin, mapZoomIndex);
  const pinPosition = getPinPosition(pin, activeMapBounds);
  const activeZoomLabel = mapZoomLevels[mapZoomIndex].label;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ symptom: symptom || "anxiety" });

    if (locationMode === "pin") {
      params.set("location", "pin");
      params.set("lat", pin.latitude.toFixed(5));
      params.set("lng", pin.longitude.toFixed(5));
      params.set("zip", zipcode || "10014");
    } else {
      params.set("location", "zip");
      params.set("zip", zipcode || "10014");
    }

    router.push(`/providers?${params.toString()}`);
  }

  function handleMapPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const longitude = activeMapBounds.west + x * (activeMapBounds.east - activeMapBounds.west);
    const latitude = activeMapBounds.north - y * (activeMapBounds.north - activeMapBounds.south);

    setPin(getPinFromCoordinates(latitude, longitude));
  }

  function handleMapWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const now = Date.now();
    if (now - lastWheelZoomAtRef.current < 180) return;
    lastWheelZoomAtRef.current = now;

    setMapZoomIndex((index) => {
      if (event.deltaY < 0) return Math.min(mapZoomLevels.length - 1, index + 1);
      if (event.deltaY > 0) return Math.max(0, index - 1);
      return index;
    });
  }

  const pinMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${activeMapBounds.west.toFixed(5)}%2C${activeMapBounds.south.toFixed(5)}%2C${activeMapBounds.east.toFixed(5)}%2C${activeMapBounds.north.toFixed(5)}&layer=mapnik&marker=${pin.latitude}%2C${pin.longitude}`;

  return (
    <form className={compact ? "intake-form compact" : "intake-form"} onSubmit={handleSubmit}>
      <div className="location-mode-toggle" aria-label="Location input mode">
        <button
          type="button"
          aria-pressed={locationMode === "zip"}
          onClick={() => setLocationMode("zip")}
        >
          ZIP code
        </button>
        <button
          type="button"
          aria-pressed={locationMode === "pin"}
          onClick={() => setLocationMode("pin")}
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
              value={zipcode}
              onChange={(event) => setZipcode(event.target.value)}
            />
          </div>
        </label>
      ) : (
        <div className="pin-map-field">
          <span>Drop a pin in NYC</span>
          <div className="pin-map" onPointerDown={handleMapPointerDown} onWheel={handleMapWheel}>
            <iframe title="NYC map pin intake" src={pinMapUrl} loading="lazy" referrerPolicy="no-referrer" />
            <span
              className="dropped-pin"
              style={{ left: `${pinPosition.xPercent}%`, top: `${pinPosition.yPercent}%` }}
              aria-hidden="true"
            >
              <LocateFixed size={22} />
            </span>
            <div className="pin-zoom-controls" aria-label="Map zoom controls" onPointerDown={(event) => event.stopPropagation()}>
              <button
                type="button"
                aria-label="Zoom out"
                disabled={mapZoomIndex === 0}
                onClick={() => setMapZoomIndex((index) => Math.max(0, index - 1))}
              >
                <Minus aria-hidden="true" size={16} />
              </button>
              <span>{activeZoomLabel}</span>
              <button
                type="button"
                aria-label="Zoom in"
                disabled={mapZoomIndex === mapZoomLevels.length - 1}
                onClick={() => setMapZoomIndex((index) => Math.min(mapZoomLevels.length - 1, index + 1))}
              >
                <Plus aria-hidden="true" size={16} />
              </button>
            </div>
            <div className="pin-map-hit-area" />
          </div>
          <p>
            Scroll to zoom. Pin set at {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
          </p>
        </div>
      )}

      <label>
        <span>Symptom</span>
        <div className="symptom-picker" ref={pickerRef}>
          <button
            type="button"
            className="field-wrap symptom-trigger"
            aria-expanded={isPickerOpen}
            aria-haspopup="listbox"
            onClick={() => setIsPickerOpen((open) => !open)}
          >
            <Stethoscope aria-hidden="true" size={18} />
            <span className={symptom ? "" : "placeholder"}>{symptom || "Select a symptom"}</span>
            <ChevronDown aria-hidden="true" size={17} />
          </button>
          {isPickerOpen ? (
            <div className="symptom-menu" role="listbox" aria-label="Symptom">
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
                        onClick={() => {
                          setSymptom(option);
                          setIsPickerOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </label>
      <button type="submit" className="primary-button">
        <span>Find a PCT</span>
        <ArrowRight aria-hidden="true" size={18} />
      </button>
    </form>
  );
}
