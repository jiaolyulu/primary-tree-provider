"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Printer, Trees } from "lucide-react";
import { CelebritreeFooter, CelebritreeHeader, CelebritreeMore } from "@/components/CelebritreeNavigation";
import { SiteNav } from "@/components/SiteNav";

export function LondonPlanetreeHighlight() {
  return <>
    <SiteNav variant="solid" />
    <main className="th-page th-london">
      <CelebritreeHeader current="london-planetree" />
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
          <Image src="/images/london-planetree-133645.webp" width={1216} height={1306} sizes="(max-width: 900px) 90vw, 540px" priority alt="Lucy’s London Planetree in a planted sidewalk bed outside a stone building with steps and columns" />
          <span className="th-photo-label">LONDON PLANETREE / BRYANT PARK</span>
          <figcaption><span>A quieter kind of waiting room.</span><span>User-supplied Google Street View image</span></figcaption>
        </figure>
      </section>
      <div className="th-file-strip"><span><Trees size={20} /> PROVIDER #133645</span><span><small>Location</small> Midtown–Midtown South</span><span><small>Specialty</small> Internal medicine</span><span><small>Office hours</small> Dawn–dusk, weekends available</span></div>
      <section className="th-section">
        <div className="th-side-label">ABOUT THE PROVIDER</div>
        <div><h2>City experience.<br /><em>A little room to breathe.</em></h2>
          <dl className="th-care-stats" aria-label="Provider care record">
            <div><dt>City residents served</dt><dd>1,200</dd><small>Fictional story estimate</small></div>
            <div><dt>Years of experience</dt><dd>~12</dd><small>Provider record</small></div>
            <div><dt>Patient reviews</dt><dd>21</dd><small>3.4 out of 5</small></div>
          </dl>
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
          <div className="th-lucy-photos" aria-label="Lucy before her visit">
            <figure><Image src="/images/lucy-noise.jpg" width={208} height={224} sizes="(max-width: 650px) 28vw, 250px" alt="Lucy covering her ears, with illustrated noise symbols around her" /><figcaption>Too much noise.</figcaption></figure>
            <figure><Image src="/images/lucy-light.jpg" width={247} height={231} sizes="(max-width: 650px) 28vw, 250px" alt="Lucy shielding her eyes from the bright lights, with green light illustrations" /><figcaption>Too much light.</figcaption></figure>
            <figure><Image src="/images/lucy-burnout.jpg" width={245} height={228} sizes="(max-width: 650px) 28vw, 250px" alt="Lucy resting her head on her hand, with an illustrated empty battery above her" /><figcaption>Running on empty.</figcaption></figure>
          </div>
          <blockquote>“The doctor spread its arms wide and let me rest in its shade.”</blockquote>
          <div className="th-story-body"><p>There was no wait time, and the London Planetree treated me with great care. During the shade treatment, my heart rate gradually returned to normal.</p><p>The doctor also shared its 12 years of experience and explained how it had developed a tolerance for urban pollution. I felt I was talking to someone who understood the city.</p><p>I especially appreciated how convenient it was to get medication. There was no need to visit a pharmacy. Instead, the doctor gently dropped a few leaves into my hand and told me to look at one leaf every morning for seven days. “Leaf,” the doctor said. “Leave.” Each leaf was a little reminder to leave Times Square and give myself a break.</p><p>After seven days, I felt much less burned out.</p></div>
          <div className="th-patient-signoff"><span className="th-patient-mark">L.</span><div><strong>Lucy</strong><span>A visit to London Planetree · Bryant Park</span></div></div>
        </div>
      </section>
      <section className="th-section"><div className="th-side-label">WHY THIS PROVIDER</div><div><h2>A practice that <em>knows the city.</em></h2><dl className="th-qualities"><div><dt><span>01</span> Close enough to pause</dt><dd>Seven minutes from Times Square in Lucy’s account. A change of surroundings can fit into a familiar walk.</dd></div><div><dt><span>02</span> An open-air office</dt><dd>An adult primary care conversation bench, with dawn-to-dusk hours and weekends available.</dd></div><div><dt><span>03</span> A simple follow-up</dt><dd>One fallen leaf, every morning for seven days. Leaf → leave: a small visual cue to step away from Times Square, its noise, and its lights.</dd></div></dl></div></section>
      <section className="th-prescription-section th-section">
        <div className="th-prescription-copy"><div className="th-eyebrow">THE DOCTOR’S ADVICE</div><h2>“If you can’t leave New York,<br /><em>at least leave Times Square.”</em></h2><p>The prescription was a little wordplay: leaf → leave. Each morning, the leaf becomes a reminder to leave Times Square and make room for a quieter moment. The medicine is the message.</p><button className="th-text-button" onClick={() => window.print()}><Printer size={16} /> Keep a copy of the prescription <ArrowRight size={16} /></button></div>
        <article className="th-prescription"><div className="th-rx-head"><span>PRIMARY CARE TREE<br /><small>LONDON PLANETREE · PROVIDER #133645</small></span><span className="th-rx">℞</span></div><div className="th-rx-line"><span>Patient</span><strong>Lucy</strong></div><div className="th-rx-line"><span>Seen for</span><strong>Urban burnout</strong></div><div className="th-rx-line"><span>Treatment</span><strong>Leaf → leave</strong></div><div className="th-rx-line"><span>Take home</span><strong>One leaf. A reminder to leave.</strong></div><div className="th-rx-line"><span>Dosage</span><strong>Look each morning for seven days</strong></div><div className="th-rx-line"><span>Directions</span><strong>Leave Times Square. Find some shade.</strong></div><div className="th-signature">Signed, the tree.</div><p>Part of a fictional care story. Not a medical prescription.</p></article>
      </section>
      <CelebritreeMore current="london-planetree" />
    </main>
    <CelebritreeFooter disclaimer="This provider profile and patient story are fiction. PCT is not a real medical service. The story’s environmental measurements and walking time are narrative context, not measurements taken during the visit." />
  </>;
}
