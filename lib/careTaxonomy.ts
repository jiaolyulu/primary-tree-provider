export type SpecialtyEntry = {
  trees: string[];
  specialty: string;
  conditions: string[];
};

export type CareCategory = {
  category: string;
  summary: string;
  specialties: SpecialtyEntry[];
};

export const careTaxonomy: CareCategory[] = [
  {
    category: "Immune, airway, and infection",
    summary: "Pollen-diplomatic and breath-aware species profiles for bodies negotiating city air.",
    specialties: [
      {
        trees: ["Sophora"],
        specialty: "Allergy and Immunology",
        conditions: ["seasonal allergies", "asthma triggers", "hives", "eczema flares"],
      },
      {
        trees: ["White Pine", "Bald Cypress", "Catalpa"],
        specialty: "Pulmonology",
        conditions: ["asthma", "chronic cough", "shortness of breath"],
      },
      {
        trees: ["Tree Of Heaven", "Sassafras"],
        specialty: "Infectious Disease",
        conditions: ["recurrent infections", "fever evaluation", "wound care"],
      },
      {
        trees: ["Chinese Fringetree", "Japanese Tree Lilac"],
        specialty: "ENT / Otolaryngology",
        conditions: ["sinus infection", "nasal congestion", "sore throat"],
      },
    ],
  },
  {
    category: "Heart, blood, and circulation",
    summary: "Deep-rooted providers for pulse, pressure, oxygen, blood flow, and slow systemic repair.",
    specialties: [
      {
        trees: ["Hawthorn"],
        specialty: "Cardiology",
        conditions: ["heart palpitations", "high cholesterol", "shortness of breath"],
      },
      {
        trees: ["Scarlet Oak", "Red Maple", "Eastern Redcedar"],
        specialty: "Hematology",
        conditions: ["low iron", "anemia", "easy bruising"],
      },
      {
        trees: ["Horse Chestnut"],
        specialty: "Vascular Medicine",
        conditions: ["leg swelling", "poor circulation", "varicose veins"],
      },
    ],
  },
  {
    category: "Metabolic and digestive care",
    summary: "Sap-balanced and fruit-and-nut care for the systems that turn city stress, meals, and sleep into energy.",
    specialties: [
      {
        trees: ["Silver Maple", "Sugar Maple", "Norway Maple"],
        specialty: "Endocrinology",
        conditions: ["diabetes", "thyroid disorder", "hormone imbalance"],
      },
      {
        trees: ["Mulberry", "Callery Pear"],
        specialty: "Nutrition and Weight Management",
        conditions: ["weight changes", "meal planning", "prediabetes nutrition"],
      },
      {
        trees: ["Common Hackberry", "Crab Apple", "Kentucky Coffeetree"],
        specialty: "Gastroenterology",
        conditions: ["stomach pain", "acid reflux", "constipation"],
      },
    ],
  },
  {
    category: "Brain, sleep, and mood",
    summary: "Calm-canopy and focus-restoring profiles for nervous systems trying to stay soft inside a hard city.",
    specialties: [
      {
        trees: ["Ginkgo"],
        specialty: "Neurology",
        conditions: ["migraine", "dizziness", "tremor", "memory changes"],
      },
      {
        trees: ["Littleleaf Linden", "Silver Linden"],
        specialty: "Psychiatry",
        conditions: ["anxiety", "insomnia", "burnout", "depression"],
      },
      {
        trees: ["Douglas-Fir", "Eastern Hemlock"],
        specialty: "Sleep Medicine",
        conditions: ["sleep apnea", "daytime sleepiness", "restless sleep"],
      },
    ],
  },
  {
    category: "Movement, pain, and aging",
    summary: "Strong-limb and long-view providers for bodies carrying weather, labor, repair, and age.",
    specialties: [
      {
        trees: ["Green Ash"],
        specialty: "Orthopedics",
        conditions: ["back pain", "shoulder pain", "arthritis"],
      },
      {
        trees: ["Weeping Willow"],
        specialty: "Pain Management",
        conditions: ["chronic pain", "nerve pain", "pain flares"],
      },
      {
        trees: ["Quaking Aspen", "American Larch"],
        specialty: "Sports Medicine",
        conditions: ["running injuries", "sprains", "knee pain"],
      },
      {
        trees: ["Pin Oak", "Willow Oak"],
        specialty: "Geriatrics",
        conditions: ["fall risk", "mobility changes", "medication management"],
      },
    ],
  },
  {
    category: "Screening, family, and life stage care",
    summary: "Everyday clinical branches for root-to-canopy primary care, growing bodies, and preventive rituals.",
    specialties: [
      {
        trees: ["Crepe Myrtle", "London Planetree"],
        specialty: "Family and Internal Medicine",
        conditions: ["annual physical", "cold and flu", "blood pressure follow-up"],
      },
      {
        trees: ["Cherry"],
        specialty: "Pediatrics",
        conditions: ["childhood fever", "ear infections", "well-child visits"],
      },
      {
        trees: ["Amur Maackia", "Katsura Tree"],
        specialty: "Preventive Medicine",
        conditions: ["annual screenings", "vaccination planning", "risk review"],
      },
      {
        trees: ["Magnolia", "Tulip-Poplar"],
        specialty: "Women's Health",
        conditions: ["menstrual concerns", "pelvic pain", "pregnancy planning"],
      },
    ],
  },
  {
    category: "Skin, eyes, kidney, and follow-up",
    summary: "Bark-aware, rain-attentive, and follow-up-friendly trees for surfaces, fluids, and long-term monitoring.",
    specialties: [
      {
        trees: ["Siberian Elm", "American Elm", "Japanese Zelkova"],
        specialty: "Dermatology",
        conditions: ["psoriasis", "eczema", "skin rash", "sun damage"],
      },
      {
        trees: ["Golden Raintree"],
        specialty: "Ophthalmology",
        conditions: ["glaucoma screening", "red eye", "cataract concerns"],
      },
      {
        trees: ["Eastern Cottonwood", "European Alder"],
        specialty: "Nephrology",
        conditions: ["kidney disease", "protein in urine", "fluid retention"],
      },
      {
        trees: ["River Birch"],
        specialty: "Urology",
        conditions: ["urinary frequency", "kidney stones", "bladder pain"],
      },
      {
        trees: ["Smoketree"],
        specialty: "Oncology",
        conditions: ["cancer screening reminders", "family cancer risk", "survivorship care"],
      },
    ],
  },
];
