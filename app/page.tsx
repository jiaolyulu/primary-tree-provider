import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IntakeForm } from "@/components/IntakeForm";

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
  },
  {
    name: "Follow-up care",
    price: "Rainwater",
    detail: "Accepted in storms, mist, and patient watering rituals.",
  },
  {
    name: "Annual membership",
    price: "Oxygen exchange",
    detail: "Breathe in, breathe out, try not to waste the shade.",
  },
  {
    name: "Premium network access",
    price: "Compost + attention",
    detail: "Look closely. Notice stress. Advocate for the root zone.",
  },
];

const testimonials = [
  {
    symptom: "Burnout + insomnia",
    tree: "Littleleaf Linden",
    neighborhood: "Midwood",
    quote:
      "The linden did not cure my calendar, but twenty minutes under its small heart-shaped leaves made sleep feel possible again.",
  },
  {
    symptom: "Migraine pressure",
    tree: "Ginkgo",
    neighborhood: "West Village",
    quote:
      "My assigned ginkgo gave me a shaded route home and a quieter place to wait out the aura before it became the whole day.",
  },
  {
    symptom: "Seasonal allergies",
    tree: "Sophora",
    neighborhood: "Jackson Heights",
    quote:
      "The Sophora visit turned pollen into a map. I started crossing on the breezier side of the block and stopped treating sneezing as random.",
  },
  {
    symptom: "Fall risk",
    tree: "Pin Oak",
    neighborhood: "Park Slope",
    quote:
      "The Pin Oak prescribed the slowest route to the grocery store: two benches, three shaded pauses, and no pretending I was not tired.",
  },
  {
    symptom: "Skin rash",
    tree: "Japanese Zelkova",
    neighborhood: "Astoria",
    quote:
      "The zelkova made exposure visible. Sun, dust, wind, construction grit: my skin had been keeping notes before I had words for them.",
  },
  {
    symptom: "Afternoon fatigue",
    tree: "Sweetgum",
    neighborhood: "Forest Hills",
    quote:
      "The Sweetgum care plan was simple: shade after lunch, one extra block, and paying attention to when the heat changed my energy.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero-section">
        <nav className="nav">
          <a href="#about">Individualized Care</a>
          <a href="#how">Local Providers</a>
          <a href="#faq">Rooted Support</a>
        </nav>

        <div className="hero-image" aria-hidden="true" />
        <div className="hero-print-grid" aria-hidden="true" />

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
          <p className="hero-index">2026 / NYC ECOLOGICAL CARE NETWORK</p>
          <h1>Primary Care Trees</h1>
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
            <span>Primary intake</span>
            <h2>Care intake</h2>
            <p>Enter a ZIP code or drop a pin. Symptom is optional; location is required.</p>
          </div>
          <div className="demo-body">
            <IntakeForm />
            <p className="demo-note">
              Try <strong>11215</strong> / <strong>fall risk</strong> or <strong>10014</strong> /{" "}
              <strong>migraine</strong>.
            </p>
          </div>
        </div>
      </section>

      <section className="metric-strip" aria-label="Primary Care Trees network">
        <div className="metric-intro">
          <span>Care network</span>
          <h2>A clinic made from the city forest.</h2>
        </div>
        <div className="metric-card">
          <span>01</span>
          <strong>Every provider is planted.</strong>
          <p>Each match points to a living street tree with a species, address, ZIP code, and neighborhood context.</p>
        </div>
        <div className="metric-card">
          <span>02</span>
          <strong>Symptoms become ecological referrals.</strong>
          <p>The intake translates concerns like heat, stress, fatigue, asthma, or rash into species-based specialties.</p>
        </div>
        <div className="metric-card">
          <span>03</span>
          <strong>Care is already circulating.</strong>
          <p>Shade, cooling, filtration, stormwater absorption, and sidewalk rest become visible as public health work.</p>
        </div>
      </section>

      <section id="about" className="section about-section">
        <div className="section-kicker">About Us</div>
        <div className="split about-split">
          <h2>Urban trees are already a care infrastructure.</h2>
          <div className="body-stack">
            <p>
              Primary Care Trees reframes the city forest as a distributed medical network. Trees cool
              streets, filter air, absorb stormwater, reduce stress, and create conditions that materially
              shape public health.
            </p>
            <p>
              The project is part clinic, part ritual, and part data visualization. Each assigned provider
              corresponds to an actual tree documented in NYC urban forestry datasets.
            </p>
          </div>
        </div>
        <figure className="poster-reference">
          <img src="/images/pct-arbocurists.png" alt="Primary Care Trees arbocurists poster" />
          <figcaption>ARB0CURISTS / CARE SPECIALISTS FACILITATING PEOPLE-TREE RELATIONSHIPS</figcaption>
        </figure>
      </section>

      <section id="how" className="section how-section">
        <div className="section-kicker">How it works</div>
        <h2>Three steps from symptom to shade.</h2>
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

      <section className="testimonial-section">
        <div className="testimonial-copy">
          <span>Patient notes</span>
          <h2>Reported relief, by provider tree.</h2>
          <p>
            Each note is written in the speculative language of care: symptom, matched tree, neighborhood,
            and the environmental prescription that helped.
          </p>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article key={`${testimonial.tree}-${testimonial.symptom}`} className="testimonial-card">
              <div>
                <span>{testimonial.symptom}</span>
                <strong>{testimonial.tree}</strong>
                <small>{testimonial.neighborhood}</small>
              </div>
              <p>"{testimonial.quote}"</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="section faq-section">
        <div className="faq-intro">
          <div className="section-kicker">FAQ</div>
          <h2>Questions your insurer will not answer.</h2>
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

      <section className="pricing-section">
        <div className="pricing-header">
          <span>Pricing</span>
          <h2>Free at point of shade.</h2>
          <p>
            PCT does not bill insurance. The network runs on public soil, municipal records, photosynthesis,
            neighborly attention, and the radical affordability of standing under a living thing.
          </p>
        </div>
        <div className="pricing-grid">
          {pricingItems.map((item) => (
            <article key={item.name} className="pricing-card">
              <span>{item.name}</span>
              <strong>{item.price}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-cta">
        <h2>Ready to check the network?</h2>
        <Link href="/providers?zip=11215&symptom=fall+risk" className="secondary-button">
          Open dashboard
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </section>
    </main>
  );
}
