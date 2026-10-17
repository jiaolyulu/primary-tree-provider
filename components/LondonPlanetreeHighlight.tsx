"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Printer, Trees } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

export function LondonPlanetreeHighlight() {
  return <>
    <SiteNav variant="solid" />
    <main className="th-page th-london">
      <div className="th-issue"><Link href="/#testimonials">← Patient notes</Link><span>TREE HIGHLIGHTS / MIDTOWN, MANHATTAN</span></div>
      <section className="th-hero">
        <div className="th-hero-copy">
          <div className="th-eyebrow"><span className="th-dot" /> FEATURED PROVIDER / #133645</div>
          <h1>London Planetree.<br /><em>Seven minutes from Times Square.</em></h1>
          <p>Lucy came for a break from the noise. At Bryant Park, a London Planetree offered a little shade, a place to pause, and an unusually convenient prescription.</p>
          <a className="th-primary" href="#patient-story">Hear from Lucy <ArrowDown size={17} /></a>
          <Link className="th-provider-link" href="/providers?zip=10018&id=133645">View London Planetree’s record <ArrowRight size={15} /></Link>
          <div className="th-hero-meta"><span>PRIMARY CARE TREE</span><span>2 WEST 42 STREET · NEW YORK 10018</span></div>
        </div>
        <figure className="th-portrait">
          <Image src="/images/lucy-bryant-park.jpg" width={554} height={313} sizes="(max-width: 650px) 90vw, 540px" priority alt="A tree-lined path with benches and visitors in Bryant Park" />
          <span className="th-photo-label">LONDON PLANETREE / BRYANT PARK</span>
          <figcaption><span>A quieter kind of waiting room.</span><span>From the project presentation</span></figcaption>
        </figure>
      </section>
      <div className="th-file-strip"><span><Trees size={20} /> PROVIDER #133645</span><span><small>Location</small> Midtown–Midtown South</span><span><small>Specialty</small> Internal medicine</span><span><small>Office hours</small> Dawn–dusk, weekends available</span></div>
      <section className="th-section">
        <div className="th-side-label">ABOUT THE PROVIDER</div>
        <div><h2>City experience.<br /><em>A little room to breathe.</em></h2>
          <div className="th-two-copy"><p>At 2 West 42 Street, London Planetree runs an adult primary care conversation bench. Its record lists approximately 12 years of experience, a 3.4 rating from 21 reviews, and a shade-side manner score of 3.2. Its philosophy: “Two minutes of shade, repeat when urban life gets loud.”</p><p>London plane trees have been part of Bryant Park’s design since its <a href="https://bryantpark.org/blog/history-of-bryant-park-the-middle-years" target="_blank" rel="noreferrer">1934 redesign during the Great Depression</a>. This provider carries on the neighborhood tradition: clear explanations, manageable next steps, and a little humor around complicated symptoms.</p></div>
        </div>
      </section>
      <section className="th-section">
        <div className="th-side-label">BEFORE THE VISIT<span>Times Square → Bryant Park</span><small>LUCY’S CASE NOTES</small></div>
        <div className="th-london-context"><div><h2>Too much city.<br /><em>Too little pause.</em></h2><p>In Lucy’s story, Times Square means 80 dB of noise and Bortle Class 9 light pollution. She begins to feel burned out. On April 2, 2026, she visits the Bryant Park location, about seven minutes away.</p><p>No reception desk. No fluorescent waiting room. Just a bench beneath the branches.</p></div><figure><Image src="/images/lucy-times-square.jpg" width={445} height={317} sizes="(max-width: 650px) 90vw, 360px" alt="Bright advertising screens and crowds in Times Square at night" /><figcaption>Times Square, from the project presentation.</figcaption></figure></div>
      </section>
      <section className="th-testimonial th-section" id="patient-story">
        <div className="th-side-label">THE PATIENT’S PERSPECTIVE<span>Lucy on finding<br />a quieter place in the city.</span><small>FICTIONAL TESTIMONIAL</small></div>
        <div><div className="th-patient-heading"><span>SEEN FOR: BURNOUT</span><span>APRIL 2, 2026</span></div>
          <blockquote>“The doctor spread its arms wide and let me rest in its shade.”</blockquote>
          <div className="th-story-body"><p>There was no wait time, and the London Planetree treated me with great care. During the shade treatment, my heart rate gradually returned to normal.</p><p>The doctor also shared its 12 years of experience and explained how it had developed a tolerance for urban pollution. I felt I was talking to someone who understood the city.</p><p>I especially appreciated how convenient it was to get medication. There was no need to visit a pharmacy. Instead, the doctor gently dropped a few leaves into my hand and told me to look at one leaf every morning for seven days.</p><p>After seven days, I felt much less burned out.</p></div>
          <div className="th-patient-signoff"><span className="th-patient-mark">L.</span><div><strong>Lucy</strong><span>A visit to London Planetree · Bryant Park</span></div></div>
        </div>
      </section>
      <section className="th-section"><div className="th-side-label">WHY THIS PROVIDER</div><div><h2>A practice that <em>knows the city.</em></h2><dl className="th-qualities"><div><dt><span>01</span> Close enough to pause</dt><dd>Seven minutes from Times Square in Lucy’s account. A change of surroundings can fit into a familiar walk.</dd></div><div><dt><span>02</span> An open-air office</dt><dd>An adult primary care conversation bench, with dawn-to-dusk hours and weekends available.</dd></div><div><dt><span>03</span> A simple follow-up</dt><dd>One fallen leaf, one quiet look, every morning for seven days. In this story, attention is the take-home prescription.</dd></div></dl></div></section>
      <section className="th-prescription-section th-section">
        <div className="th-prescription-copy"><div className="th-eyebrow">THE DOCTOR’S ADVICE</div><h2>“If you can’t leave New York,<br /><em>at least leave Times Square.”</em></h2><p>The consultation ended with a few fallen leaves and a small daily ritual. No pharmacy stop required.</p><button className="th-text-button" onClick={() => window.print()}><Printer size={16} /> Keep a copy of the prescription <ArrowRight size={16} /></button></div>
        <article className="th-prescription"><div className="th-rx-head"><span>PRIMARY CARE TREE<br /><small>LONDON PLANETREE · PROVIDER #133645</small></span><span className="th-rx">℞</span></div><div className="th-rx-line"><span>Patient</span><strong>Lucy</strong></div><div className="th-rx-line"><span>Seen for</span><strong>Urban burnout</strong></div><div className="th-rx-line"><span>Treatment</span><strong>A pause in the shade</strong></div><div className="th-rx-line"><span>Take home</span><strong>Look at one fallen leaf</strong></div><div className="th-rx-line"><span>Dosage</span><strong>Each morning, seven days</strong></div><div className="th-signature">Signed, the tree.</div><p>Part of a fictional care story. Not a medical prescription.</p></article>
      </section>
      <section className="th-find-provider"><div><div className="th-eyebrow">MORE PATIENT NOTES</div><h2>A familiar kind <em>of patchy.</em></h2></div><Link className="th-primary" href="/highlights">Meet Cherry on Front Street <ArrowRight size={17} /></Link></section>
    </main>
    <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><Image width={60} height={56} src="/images/tree-logo-white.svg" alt="Primary Care Tree" className="footer-logo" /><p>A speculative medical network that allows New York City trees to provide care.</p></div><div className="footer-nav"><span>Network</span><Link href="/">Home</Link><Link href="/#testimonials">Patient notes</Link><Link href="/pcts">Browse providers</Link></div></div><div className="footer-disclaimer"><p>This provider profile and patient story are fiction. PCT is not a real medical service. The story’s environmental measurements and walking time are narrative context, not measurements taken during the visit.</p></div></footer>
  </>;
}
