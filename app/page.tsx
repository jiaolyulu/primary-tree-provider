import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { BubbleCanvas } from "@/components/BubbleCanvas";
import { HeroVideo } from "@/components/HeroVideo";
import { IntakeForm } from "@/components/IntakeForm";
import { LeafCanvas } from "@/components/LeafCanvas";
import { RainCanvas } from "@/components/RainCanvas";
import { RootsCanvas } from "@/components/RootsCanvas";

const steps = [
  {
    number: "01",
    title: "Describe what is happening",
    text: "Enter a ZIP code or drop a pin. A symptom can refine the match, but location is the required starting point.",
  },
  {
    number: "02",
    title: "Match ecology to care",
    text: "Species, condition pools, ratings, wait times, sidewalk access, and neighborhood location shape the ranked provider list.",
  },
  {
    number: "03",
    title: "Meet your provider tree",
    text: "Review the tree's specialty, address, care philosophy, prescription, and environmental role before choosing a visit.",
  },
];

const faqs = [
  {
    question: "What is a primary tree?",
    answer:
      "A primary tree is a tree that you can access easily to help guide your care, managing common and uncommon medical problems including persistent symptoms, daily wellness checks, sadness prevention, and referrals to other tree providers.",
  },
  {
    question: "Can I bring a saw to my appointment?",
    answer:
      "No. Saws, axes, hatchets, hostile pruning equipment, and bad faith arborist cosplay are not allowed at any provider visit. Bring water, patience, and a willingness to stand still.",
  },
  {
    question: "I asked a redwood for longevity advice. What did I learn?",
    answer:
      "The redwood recommended fewer urgent emails, deeper roots, more fungal friendships, and a longer view of the body. It also noted that most human problems are made worse by shallow soil.",
  },
  {
    question: "Can one tree intake multiple people at the same time?",
    answer:
      "Yes. Trees are group-practice specialists. One canopy can hold several appointments at once, especially for heat stress, waiting-room anxiety, post-lunch fatigue, and people who need to be quiet near one another.",
  },
  {
    question: "My provider tree is seasonal. Can I have more than one PCT?",
    answer:
      "Yes. You may keep a winter PCT, a summer shade provider, and a flowering-season specialist. Continuity of care is encouraged, but the system respects that leaves, symptoms, and people all change.",
  },
  {
    question: "Do tree providers write prescriptions?",
    answer:
      "They write environmental prescriptions: cross on the shady side, sit under the linden before sleep, take the long route past the oak, avoid the pollen corridor, return after rain.",
  },
  {
    question: "What if my PCT drops things during the visit?",
    answer:
      "Seed pods, leaves, flowers, and small seasonal debris are considered clinical materials. They may be interpreted as notes, reminders, or a request to look up.",
  },
];

const pricingItems = [
  {
    name: "First visit",
    price: "$0",
    detail: "Covered by the existing municipal canopy.",
    fx: "leaves",
  },
  {
    name: "Follow-up care",
    price: "Rainwater",
    detail: "Accepted in storms, mist, and patient watering rituals.",
    fx: "rain",
  },
  {
    name: "Annual membership",
    price: "Oxygen exchange",
    detail: "Breathe in, breathe out, try not to waste the shade.",
    fx: "breath",
  },
  {
    name: "Premium network access",
    price: "Compost + attention",
    detail: "Look closely. Notice stress. Advocate for the root zone.",
    fx: "roots",
  },
];

const testimonials = [
  {
    symptom: "Burnout + insomnia",
    tree: "Littleleaf Linden",
    neighborhood: "Midwood",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Tilia%20cordata%20-%20%27Greenspire%27%20littleleaf%20linden.jpg?width=900",
    imageAlt: "Littleleaf Linden tree canopy",
    quote:
      "The linden did not cure my calendar, but twenty minutes under its small heart-shaped leaves made sleep feel possible again.",
  },
  {
    symptom: "Migraine pressure",
    tree: "Ginkgo",
    neighborhood: "West Village",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ginkgo-biloba-tree-in-fall.jpg?width=900",
    imageAlt: "Ginkgo biloba tree in fall",
    quote:
      "My assigned ginkgo gave me a shaded route home and a quieter place to wait out the aura before it became the whole day.",
  },
  {
    symptom: "Seasonal allergies",
    tree: "Sophora",
    neighborhood: "Jackson Heights",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/20120905Styphnolobium%20japonicum.jpg?width=900",
    imageAlt: "Sophora tree in leaf",
    quote:
      "The Sophora visit turned pollen into a map. I started crossing on the breezier side of the block and stopped treating sneezing as random.",
  },
  {
    symptom: "Fall risk",
    tree: "Pin Oak",
    neighborhood: "Park Slope",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Pin%20oak%20quercus%20palustris.jpg?width=900",
    imageAlt: "Pin Oak tree",
    quote:
      "The Pin Oak prescribed the slowest route to the grocery store: two benches, three shaded pauses, and no pretending I was not tired.",
  },
  {
    symptom: "Skin rash",
    tree: "Japanese Zelkova",
    neighborhood: "Astoria",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Zelkova%20serrata%20entire.jpg?width=900",
    imageAlt: "Japanese Zelkova tree",
    quote:
      "The zelkova made exposure visible. Sun, dust, wind, construction grit: my skin had been keeping notes before I had words for them.",
  },
  {
    symptom: "Afternoon fatigue",
    tree: "Sweetgum",
    neighborhood: "Forest Hills",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/E20151113-0001%E2%80%94Liquidambar%20styraciflua%E2%80%94Berkelely%20%2822378349813%29.jpg?width=900",
    imageAlt: "Sweetgum tree",
    quote:
      "The Sweetgum care plan was simple: shade after lunch, one extra block, and paying attention to when the heat changed my energy.",
  },
];

const featuredDoctors = [
  {
    doctorId: 2827,
    condition: "Asthma triggers + seasonal allergies",
    tree: "Sophora",
    species: "Styphnolobium japonicum",
    specialty: "Allergy and Immunology",
    neighborhood: "North Side-South Side",
    rating: "5.0",
    reviews: 185,
    prescription: "Hydrate early; catastrophize late, if at all.",
    note: "A pollen-season provider for hives, eczema flares, food allergies, and breathy sidewalk weather.",
  },
  {
    doctorId: 522923,
    condition: "Heart palpitations",
    tree: "Hawthorn",
    species: "Crataegus",
    specialty: "Cardiology",
    neighborhood: "Murray Hill-Kips Bay",
    rating: "5.0",
    reviews: 147,
    prescription: "Reduce urgency by one branch per day.",
    note: "Hawthorn handles pulse anxiety, shortness of breath, cholesterol worries, and the body's metronome.",
  },
  {
    doctorId: 368556,
    condition: "Psoriasis + eczema",
    tree: "Siberian Elm",
    species: "Ulmus pumila",
    specialty: "Dermatology",
    neighborhood: "Georgetown-Marine Park-Bergen Beach-Mill Basin",
    rating: "5.0",
    reviews: 230,
    prescription: "Apply shade generously to exposed plans.",
    note: "A skin-surface specialist for rash, dry skin, acne, and sun-friction days.",
  },
  {
    doctorId: 256850,
    condition: "Sinus infection",
    tree: "Chinese Fringetree",
    species: "Chionanthus retusus",
    specialty: "ENT / Otolaryngology",
    neighborhood: "Murray Hill",
    rating: "5.0",
    reviews: 125,
    prescription: "Bring the symptom, leave with a plan and one leaf of perspective.",
    note: "For nasal congestion, sore throat, hearing concerns, and voice changes after loud city air.",
  },
  {
    doctorId: 139158,
    condition: "Sudden pain + fever triage",
    tree: "Black Pine",
    species: "Pinus nigra",
    specialty: "Emergency Medicine",
    neighborhood: "Central Harlem North-Polo Grounds",
    rating: "5.0",
    reviews: 132,
    prescription: "If it is sudden, start with shade and then escalate responsibly.",
    note: "A same-day assessment tree for minor injuries, dizziness, urgent symptoms, and cuts.",
  },
  {
    doctorId: 694551,
    condition: "Diabetes + hormone imbalance",
    tree: "Silver Maple",
    species: "Acer saccharinum",
    specialty: "Endocrinology",
    neighborhood: "Bayside-Bayside Hills",
    rating: "5.0",
    reviews: 218,
    prescription: "Sit nearby until the sidewalk stops arguing.",
    note: "A metabolic provider for fatigue, weight changes, thyroid disorder, and blood-sugar weather.",
  },
  {
    doctorId: 331227,
    condition: "Cold, flu + routine checkups",
    tree: "Crepe Myrtle",
    species: "Lagerstroemia",
    specialty: "Family Medicine",
    neighborhood: "Port Richmond",
    rating: "5.0",
    reviews: 132,
    prescription: "Two minutes of shade, repeat when urban life gets loud.",
    note: "A neighborhood generalist for annual physicals, vaccinations, and ordinary body maintenance.",
  },
  {
    doctorId: 712792,
    condition: "Stomach pain + bloating",
    tree: "Common Hackberry",
    species: "Celtis occidentalis",
    specialty: "Gastroenterology",
    neighborhood: "South Ozone Park",
    rating: "5.0",
    reviews: 151,
    prescription: "Bring the symptom, leave with a plan and one leaf of perspective.",
    note: "A gut-route provider for constipation, diarrhea, colon screening, and uneasy lunch aftermaths.",
  },
  {
    doctorId: 434704,
    condition: "Fall risk + mobility changes",
    tree: "Pin Oak",
    species: "Quercus palustris",
    specialty: "Geriatrics",
    neighborhood: "Briarwood-Jamaica Hills",
    rating: "5.0",
    reviews: 224,
    prescription: "Take the long view with a short walk.",
    note: "An aging-care provider for medication management, frailty screening, and slower safe routes.",
  },
  {
    doctorId: 350900,
    condition: "Low iron + easy bruising",
    tree: "Scarlet Oak",
    species: "Quercus coccinea",
    specialty: "Hematology",
    neighborhood: "Richmond Hill",
    rating: "5.0",
    reviews: 242,
    prescription: "Hydrate early; catastrophize late, if at all.",
    note: "A blood-work companion for anemia, clot history, bleeding concerns, and fatigue from anemia.",
  },
  {
    doctorId: 144776,
    condition: "Recurrent infections",
    tree: "Tree Of Heaven",
    species: "Ailanthus altissima",
    specialty: "Infectious Disease",
    neighborhood: "Brownsville",
    rating: "5.0",
    reviews: 188,
    prescription: "Sit nearby until the sidewalk stops arguing.",
    note: "A resilient provider for fever evaluation, wound infection, travel health, and antibiotic questions.",
  },
  {
    doctorId: 230554,
    condition: "High blood pressure + diabetes follow-up",
    tree: "London Planetree",
    species: "Platanus x acerifolia",
    specialty: "Internal Medicine",
    neighborhood: "Grymes Hill-Clifton-Fox Hills",
    rating: "5.0",
    reviews: 243,
    prescription: "Sit nearby until the sidewalk stops arguing.",
    note: "A chronic-care anchor for medication review, cholesterol, adult wellness, and long appointments.",
  },
  {
    doctorId: 184551,
    condition: "Kidney disease + fluid retention",
    tree: "Eastern Cottonwood",
    species: "Populus deltoides",
    specialty: "Nephrology",
    neighborhood: "East Tremont",
    rating: "5.0",
    reviews: 123,
    prescription: "Sit nearby until the sidewalk stops arguing.",
    note: "A water-balance provider for protein in urine, electrolyte imbalance, and kidney monitoring.",
  },
  {
    doctorId: 678344,
    condition: "Migraine + dizziness",
    tree: "Ginkgo",
    species: "Ginkgo biloba",
    specialty: "Neurology",
    neighborhood: "Crown Heights North",
    rating: "5.0",
    reviews: 193,
    prescription: "Two minutes of shade, repeat when urban life gets loud.",
    note: "A nervous-system provider for tremor, headache, numbness, tingling, and aura days.",
  },
  {
    doctorId: 141019,
    condition: "Weight changes + meal planning",
    tree: "Mulberry",
    species: "Morus",
    specialty: "Nutrition and Weight Management",
    neighborhood: "Fort Greene",
    rating: "5.0",
    reviews: 180,
    prescription: "Balance the plate, then balance the afternoon.",
    note: "A food-and-shade provider for metabolic health, cholesterol nutrition, and prediabetes planning.",
  },
  {
    doctorId: 714039,
    condition: "Cancer screening reminders",
    tree: "Smoketree",
    species: "Cotinus coggygria",
    specialty: "Oncology",
    neighborhood: "Woodhaven",
    rating: "5.0",
    reviews: 23,
    prescription: "Sit nearby until the sidewalk stops arguing.",
    note: "A quiet follow-up provider for family cancer risk, survivorship care, and abnormal imaging anxiety.",
  },
  {
    doctorId: 207534,
    condition: "Glaucoma screening + red eye",
    tree: "Golden Raintree",
    species: "Koelreuteria paniculata",
    specialty: "Ophthalmology",
    neighborhood: "Upper West Side",
    rating: "5.0",
    reviews: 132,
    prescription: "Sit nearby until the sidewalk stops arguing.",
    note: "An eye-care provider for cataract concerns, dry eyes, diabetic eye screening, and irritation.",
  },
  {
    doctorId: 143475,
    condition: "Back pain + arthritis",
    tree: "Green Ash",
    species: "Fraxinus pennsylvanica",
    specialty: "Orthopedics",
    neighborhood: "Prospect Heights",
    rating: "5.0",
    reviews: 187,
    prescription: "Two minutes of shade, repeat when urban life gets loud.",
    note: "A joint-and-bone provider for hip pain, shoulder pain, mobility problems, and fracture follow-up.",
  },
  {
    doctorId: 405732,
    condition: "Chronic pain + nerve pain",
    tree: "Weeping Willow",
    species: "Salix babylonica",
    specialty: "Pain Management",
    neighborhood: "Hunters Point-Sunnyside-West Maspeth",
    rating: "5.0",
    reviews: 149,
    prescription: "Function first; heroics can wait until after shade.",
    note: "A flare-management provider for joint pain, neck pain, pain flares, and non-heroic pacing.",
  },
  {
    doctorId: 637147,
    condition: "Childhood fever + ear infections",
    tree: "Cherry",
    species: "Prunus",
    specialty: "Pediatrics",
    neighborhood: "Ft. Totten-Bay Terrace-Clearview",
    rating: "5.0",
    reviews: 168,
    prescription: "Small worries may park under the lowest branch.",
    note: "A child-care provider for well-child visits, growth concerns, school physicals, and allergies.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero-section">
        <nav className="nav">
          <Link href="/" className="nav-logo" aria-label="Primary Care Tree — home">
            <img src="/images/tree-logo.svg" alt="Primary Care Tree" />
          </Link>
          <div className="nav-right">
            <div className="nav-links">
              <a href="#about">About</a>
              <a href="#pricing">Pricing</a>
              <a href="#testimonials">Testimonials</a>
              <a href="#featured-doctors">Doctors</a>
              <a href="#faq">Q&amp;A</a>
            </div>
            <Link href="/providers?zip=11215" className="nav-cta">
              Browse all PCTs
            </Link>
          </div>
        </nav>

        <HeroVideo />
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-noise" aria-hidden="true" />

        <div className="hero-brand-stamp" aria-label="Primary Care Tree logo">
          <div className="stamp-trees">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <strong>Primary Care Tree</strong>
        </div>

        <div className="hero-copy">
          <p className="hero-index">2026 / New York City Care Network based on Urban Forestry</p>
          <h1>
            Primary Care <em>Trees</em>
          </h1>
          <p className="hero-subtitle">
            We help you find the primary care tree that is right for you.
          </p>
          <div className="hero-proof-line" aria-label="Provider network details">
            <span>96,950 providers</span>
            <span>30 specialties</span>
            <span>183 ZIP codes</span>
          </div>
        </div>

        <div className="hero-demo" aria-label="Find a Primary Care Tree">
          <div className="demo-header">
            <h2>Care intake</h2>
          </div>
          <div className="demo-body">
            <IntakeForm />
          </div>
        </div>
      </section>

      <section className="metric-strip" aria-label="Primary Care Trees network">
        <div className="metric-intro">
          <h2>
          A care network <em>rooted</em> in NYC.
          </h2>
        </div>
        <div className="metric-card">
          <span>01</span>
          <strong>Every provider is planted.</strong>
          <p>Each provider is a living tree with a documented location, species, and service area.</p>
        </div>
        <div className="metric-card">
          <span>02</span>
          <strong>Every symptom starts a search.</strong>
          <p>The network considers your symptoms, location, and provider specialties to identify a Primary Tree.</p>
        </div>
        <div className="metric-card">
          <span>03</span>
          <strong>Every act of care circulates.</strong>
          <p>The network traces connections between providers, specialties, and places throughout the city.</p>
        </div>
      </section>

      <section id="about" className="section about-section">
        <div className="section-kicker">About Us</div>
        <div className="split about-split">
          <h2>
            Find care closer to <em>you</em>.
          </h2>
          <div className="body-stack">
            <p>
              Primary Care Trees is a distributed medical network where trees serve as care providers.
              Using NYC Open Data, we connect New Yorkers with nearby Primary Tree providers through localized
              care matching and ecological specialties.
            </p>
            <p>
              Our network is coordinated by Arbocurists — care specialists who facilitate relationships between
              people and tree providers.
            </p>
          </div>
        </div>
        <figure className="poster-reference">
          <div className="poster-header">
          </div>
          <img src="/images/arbocurists.png" alt="Arbocurists illustration — five people rendered as tree rings" />
          <div className="poster-definition">
            <div className="poster-definition-entry">
              <strong>Arbocurists (n.)</strong>
              <em className="poster-phonetic">/ˈar.boʊkjʊr.ɪst/</em>
              <p>A team of care specialists facilitating relationships between people and tree providers.</p>
              <p className="poster-see-also">See also: Lu Lyu, Yan Chen, shuang cai, Fanyi Pan, Ruichao Jiang</p>
            </div>
          </div>
          <div className="poster-disciplines">
            <span>SPECULATIVE DESIGN</span>
            <span>INTERACTION DESIGN</span>
            <span>CREATIVE TECH</span>
            <span>DATA-DRIVEN STORYTELLING</span>
          </div>
        </figure>
      </section>

      <section id="how" className="section how-section">
        <div className="section-kicker">How it works</div>
        <h2>
          Three steps from symptom to <em>shade</em>.
        </h2>
        <div className="steps-grid">
          {steps.map((step) => (
            <article key={step.number} className="step-card">
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="testimonials" className="testimonial-section">
        <div className="testimonial-copy">
          <span>Patient notes</span>
          <h2>
            Reported relief, by provider <em>tree</em>.
          </h2>
          <p>
            Each note is written in the speculative language of care: symptom, matched tree, neighborhood, and
            the environmental prescription that helped.
          </p>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article
              key={`${testimonial.tree}-${testimonial.symptom}`}
              className="testimonial-card"
              tabIndex={0}
              aria-label={`${testimonial.tree} patient note. Hover or focus to view the provider tree image.`}
            >
              <div className="testimonial-card-inner">
                <div className="testimonial-card-face testimonial-card-front">
                  <div className="testimonial-card-meta">
                    <span>{testimonial.symptom}</span>
                    <strong>{testimonial.tree}</strong>
                    <small>
                      <MapPin aria-hidden="true" size={12} />
                      {testimonial.neighborhood}
                    </small>
                  </div>
                  <p>&ldquo;{testimonial.quote}&rdquo;</p>
                </div>
                <div className="testimonial-card-face testimonial-card-back">
                  <img src={testimonial.image} alt={testimonial.imageAlt} loading="lazy" />
                  <div className="testimonial-image-label">
                    <span>Provider tree</span>
                    <strong>{testimonial.tree}</strong>
                    <p>&ldquo;{testimonial.quote}&rdquo;</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="featured-doctors" className="doctor-section">
        <div className="testimonial-copy">
          <span>Featured doctors</span>
          <h2>
            Twenty provider trees, twenty care <em>specialties</em>.
          </h2>
          <p>
            A curated set of high-rated doctors from the NYC provider index, selected for different species,
            specialties, and the wonderfully strange question of which tree treats which symptom.
          </p>
        </div>
        <div className="doctor-grid">
          {featuredDoctors.map((doctor) => (
            <article
              key={doctor.doctorId}
              className="doctor-card"
              tabIndex={0}
              aria-label={`${doctor.tree} doctor profile for ${doctor.condition}. Hover or focus to view more.`}
            >
              <div className="doctor-card-inner">
                <div className="doctor-card-face doctor-card-front">
                  <div className="testimonial-card-meta">
                    <span>{doctor.condition}</span>
                    <strong>{doctor.tree}</strong>
                    <small>
                      <MapPin aria-hidden="true" size={12} />
                      {doctor.neighborhood}
                    </small>
                  </div>
                  <p>
                    {doctor.tree} treats {doctor.condition.toLowerCase()} through {doctor.specialty.toLowerCase()},
                    translating a real street-tree record into a care relationship.
                  </p>
                </div>
                <div className="doctor-card-face doctor-card-back">
                  <div className="doctor-card-label">
                    <span>Doctor ID {doctor.doctorId}</span>
                    <strong>{doctor.specialty}</strong>
                    <div className="doctor-card-fields" aria-label={`${doctor.tree} provider data`}>
                      <span>{doctor.species}</span>
                      <span>{doctor.rating} rating / {doctor.reviews} reviews</span>
                    </div>
                    <p>{doctor.note}</p>
                    <p className="doctor-prescription">{doctor.prescription}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="section faq-section">
        <div className="faq-intro">
          <div className="section-kicker">FAQ</div>
          <h2>
            Questions your insurer will <em>not</em> answer.
          </h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={faq.question} open={index === 0}>
              <summary>
                <span>{String(index + 1).padStart(3, "0")}</span>
                {faq.question}
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="pricing-header">
          <h2>Pricing</h2>
          <p>
            PCT does not bill insurance. The network runs on public soil, municipal records, photosynthesis,
            neighborly attention, and the radical affordability of standing under a living thing.
          </p>
        </div>
        <div className="pricing-grid">
          {pricingItems.map((item) => (
            <article key={item.name} className="pricing-card" data-fx={item.fx}>
              {item.fx === "rain" ? (
                <RainCanvas />
              ) : item.fx === "breath" ? (
                <BubbleCanvas />
              ) : item.fx === "leaves" ? (
                <LeafCanvas />
              ) : (
                <RootsCanvas />
              )}
              <span>{item.name}</span>
              <strong>{item.price}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-cta">
        <h2>
          Ready to check the <em>network</em>?
        </h2>
        <Link href="/providers?zip=11215&symptom=fall+risk" className="secondary-button">
          Open dashboard
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </section>

      <footer className="site-footer">
        <p>
          PCT acknowledges the sacrifice of peer species involved in building and maintaining PCT care
          infrastructure, including but not limited to paper and print production, furniture manufacturing,
          and data center construction. PCT does not endorse the sacrifice of trees and remains committed
          to expanding equitable care relationships between human and non-human providers.
        </p>
        <p>
          PCT is not a real medical service. For any serious disease or unwell, please consult a real
          healthcare provider.
        </p>
      </footer>
    </main>
  );
}
