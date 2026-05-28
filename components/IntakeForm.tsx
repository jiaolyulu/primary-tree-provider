"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, MapPin, Stethoscope } from "lucide-react";

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

export function IntakeForm({
  compact = false,
  initialZip = "",
  initialSymptom = "",
}: {
  compact?: boolean;
  initialZip?: string;
  initialSymptom?: string;
}) {
  const router = useRouter();
  const pickerRef = useRef<HTMLDivElement>(null);
  const [zipcode, setZipcode] = useState(initialZip);
  const [symptom, setSymptom] = useState(initialSymptom);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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
    const params = new URLSearchParams({
      zip: zipcode || "10014",
      symptom: symptom || "anxiety",
    });
    router.push(`/providers?${params.toString()}`);
  }

  return (
    <form className={compact ? "intake-form compact" : "intake-form"} onSubmit={handleSubmit}>
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
