export type SpecialtyEntry = {
  trees: string[];
  specialty: string;
  conditions: string[];
  rationale: string;
};

export type CareCategory = {
  category: string;
  summary: string;
  specialties: SpecialtyEntry[];
};

export const careTaxonomy: CareCategory[] = [
  {
    category: "Immune, airway, and infection",
    summary: "Pollen-diplomatic, breath-aware, defense-ready species profiles for bodies negotiating city air.",
    specialties: [
      {
        trees: ["Sophora"],
        specialty: "Allergy and Immunology",
        conditions: ["seasonal allergies", "food allergies", "hives"],
        rationale:
          "Sophora flowers boldly and brings plenty of pollen into the season, so it feels like a natural fit for allergy and immune questions.",
      },
      {
        trees: ["White Pine", "Bald Cypress", "Catalpa"],
        specialty: "Pulmonology",
        conditions: ["asthma", "chronic cough", "shortness of breath"],
        rationale:
          "These are airy, resinous, wind-facing trees; pine scent, cypress breath, and Catalpa's broad leaves all point toward the lungs.",
      },
      {
        trees: ["Tree Of Heaven", "Sassafras"],
        specialty: "Infectious Disease",
        conditions: ["recurrent infections", "fever evaluation", "travel health"],
        rationale:
          "Tree Of Heaven and Sassafras are stubborn survivors, which makes them feel suited to fevers, wounds, and recovery.",
      },
      {
        trees: ["Chinese Fringetree", "Japanese Tree Lilac"],
        specialty: "ENT / Otolaryngology",
        conditions: ["sinus infection", "ear pain", "sore throat"],
        rationale:
          "Fragrant flowers put the nose and throat first, so these trees feel right for sinus, ear, and voice concerns.",
      },
      {
        trees: ["Black Pine"],
        specialty: "Emergency Medicine",
        conditions: ["urgent symptoms", "minor injuries", "sudden pain"],
        rationale:
          "Black Pine feels compact, tough, and ready at the curb, like the tree you would turn to for same-day triage.",
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
        conditions: ["high blood pressure", "chest pain", "high cholesterol"],
        rationale: "Hawthorn already carries a heart-care reputation, so it belongs with pulse, pressure, and circulation.",
      },
      {
        trees: ["Scarlet Oak", "Red Maple", "Eastern Redcedar"],
        specialty: "Hematology",
        conditions: ["anemia", "easy bruising", "blood clot history"],
        rationale: "The red names and red leaves make these trees feel close to blood, bruising, iron, and clot concerns.",
      },
      {
        trees: ["Horse Chestnut"],
        specialty: "Vascular Medicine",
        conditions: ["leg swelling", "varicose veins", "poor circulation"],
        rationale: "Horse Chestnut has a familiar vein-and-circulation association, especially for legs and flow.",
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
        conditions: ["diabetes", "thyroid disorder", "weight changes"],
        rationale: "Maples bring sap, sugar, and seasonal energy to mind, which makes them feel tied to metabolism.",
      },
      {
        trees: ["Mulberry", "Callery Pear"],
        specialty: "Nutrition and Weight Management",
        conditions: ["weight changes", "cholesterol nutrition", "prediabetes nutrition"],
        rationale: "Fruit-bearing trees make the food connection immediate, so they sit naturally with nutrition and habits.",
      },
      {
        trees: ["Common Hackberry", "Crab Apple", "Kentucky Coffeetree"],
        specialty: "Gastroenterology",
        conditions: ["acid reflux", "IBS", "stomach pain"],
        rationale: "Apples, berries, and coffeetree beans all bring eating and after-meal comfort into the story.",
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
        conditions: ["migraine", "memory changes", "headache"],
        rationale: "Ginkgo is the obvious memory tree, with a long cultural link to focus, cognition, and the head.",
      },
      {
        trees: ["Littleleaf Linden", "Silver Linden"],
        specialty: "Psychiatry",
        conditions: ["anxiety", "depression", "insomnia"],
        rationale: "Linden feels gentle and calming, the kind of tree you would sit under when your nervous system needs quiet.",
      },
      {
        trees: ["Douglas-Fir", "Eastern Hemlock"],
        specialty: "Sleep Medicine",
        conditions: ["insomnia", "sleep apnea", "snoring"],
        rationale: "These darker, quieter evergreens have a stillness that feels close to rest, shade, and sleep.",
      },
    ],
  },
  {
    category: "Movement, pain, and aging",
    summary: "Strong-limb and long-view providers for bodies carrying weather, labor, repair, and age.",
    specialties: [
      {
        trees: ["Green Ash", "American Hornbeam", "Persian Ironwood"],
        specialty: "Orthopedics",
        conditions: ["joint injury", "fracture follow-up", "back pain"],
        rationale: "Ash, hornbeam, and ironwood are sturdy structural trees, so they feel right for bones, joints, and posture.",
      },
      {
        trees: ["Kentucky Yellowwood"],
        specialty: "Rheumatology",
        conditions: ["joint pain", "arthritis", "autoimmune concerns"],
        rationale: "Yellowwood has a flexible, medicinal feel, which suits the slow work of joints, inflammation, and connective tissue.",
      },
      {
        trees: ["Weeping Willow"],
        specialty: "Pain Management",
        conditions: ["chronic pain", "back pain", "neck pain"],
        rationale: "Willow has the clearest pain-relief lineage here, thanks to its salicin association.",
      },
      {
        trees: ["Quaking Aspen", "American Larch"],
        specialty: "Sports Medicine",
        conditions: ["sprains", "running injuries", "knee pain"],
        rationale: "Quaking Aspen and Larch feel active and trail-ready, so they make sense for strains, knees, and recovery.",
      },
      {
        trees: ["Shantung Maple"],
        specialty: "Occupational Medicine",
        conditions: ["work injury", "ergonomic strain", "return-to-work visit"],
        rationale: "Shantung Maple sounds place-based and workaday, a good fit for city routines, commute strain, and job physicals.",
      },
      {
        trees: ["Pin Oak", "Willow Oak", "American Beech"],
        specialty: "Geriatrics",
        conditions: ["memory concerns", "fall risk", "medication management"],
        rationale: "Oaks and beeches feel old, steady, and watchful, exactly the mood of careful aging care.",
      },
    ],
  },
  {
    category: "Screening, family, and life stage care",
    summary: "Everyday clinical branches for root-to-canopy primary care, growing bodies, and preventive rituals.",
    specialties: [
      {
        trees: ["Crepe Myrtle"],
        specialty: "Family Medicine",
        conditions: ["annual physical", "cold and flu", "preventive care"],
        rationale: "Crepe Myrtle is a familiar neighborhood tree, approachable enough for everyday whole-family care.",
      },
      {
        trees: ["Honeylocust", "London Planetree", "Sycamore Maple"],
        specialty: "Internal Medicine",
        conditions: ["chronic disease care", "fatigue", "medication review"],
        rationale: "These are common city generalists, steady enough for adult checkups, fatigue, and long-term conditions.",
      },
      {
        trees: ["Cherry", "Eastern Redbud"],
        specialty: "Pediatrics",
        conditions: ["childhood fever", "growth concerns", "school physicals"],
        rationale: "Cherry and Redbud have a spring, growth, and blossom feeling that suits children and adolescents.",
      },
      {
        trees: ["Amur Maackia", "Katsura Tree"],
        specialty: "Preventive Medicine",
        conditions: ["annual screenings", "vaccination planning", "healthy aging"],
        rationale: "Maackia and Katsura feel hardy and well-kept, which suits screenings, upkeep, and prevention.",
      },
      {
        trees: ["Magnolia", "Tulip-Poplar"],
        specialty: "Women's Health",
        conditions: ["well-woman visit", "menstrual concerns", "menopause symptoms"],
        rationale: "Large blooms and seasonal change give these trees a strong life-stage feeling.",
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
        conditions: ["acne", "eczema", "psoriasis"],
        rationale: "Elm and Zelkova show their care on the surface: bark, texture, peeling, and repair.",
      },
      {
        trees: ["Golden Raintree", "Empress Tree"],
        specialty: "Ophthalmology",
        conditions: ["vision changes", "dry eyes", "eye irritation"],
        rationale: "Bright crowns and filtered light make these trees feel close to seeing, glare, and eye comfort.",
      },
      {
        trees: ["Eastern Cottonwood", "European Alder"],
        specialty: "Nephrology",
        conditions: ["kidney disease", "high blood pressure", "protein in urine"],
        rationale: "Cottonwood and Alder like wet ground, so they feel right for fluid balance and kidney care.",
      },
      {
        trees: ["River Birch"],
        specialty: "Urology",
        conditions: ["urinary tract infection", "urinary frequency", "kidney stones"],
        rationale: "River Birch already carries the idea of water and flow in its name.",
      },
      {
        trees: ["Smoketree"],
        specialty: "Oncology",
        conditions: ["cancer screening", "lump evaluation", "survivorship care"],
        rationale: "Smoketree has an unusual, watchful presence that fits screening, follow-up, and survivorship care.",
      },
    ],
  },
];
