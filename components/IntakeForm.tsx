"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, MapPin, Stethoscope } from "lucide-react";

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
  const [zipcode, setZipcode] = useState(initialZip);
  const [symptom, setSymptom] = useState(initialSymptom);

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
        <div className="field-wrap">
          <Stethoscope aria-hidden="true" size={18} />
          <select
            aria-label="Symptom"
            value={symptom}
            onChange={(event) => setSymptom(event.target.value)}
          >
            <option value="">Select a symptom</option>
            {symptomGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </label>
      <button type="submit" className="primary-button">
        <span>Find a PCT</span>
        <ArrowRight aria-hidden="true" size={18} />
      </button>
    </form>
  );
}
