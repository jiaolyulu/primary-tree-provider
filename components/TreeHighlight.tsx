"use client";

import Image from "next/image";

import Link from "next/link";
import { ArrowDown, ArrowRight, Printer, Trees } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

export function TreeHighlight() {
  return (
    <>
      <SiteNav variant="solid" />
      <main className="th-page">
      <div className="th-issue"><Link href="/#testimonials">← Patient notes</Link><Link href="/highlights/london-planetree">Next story: Lucy’s London Planetree →</Link></div>
      <section className="th-hero">
        <div className="th-hero-copy">
          <div className="th-eyebrow"><span className="th-dot" /> FEATURED PROVIDER / #156484</div>
          <h1>Cherry on Front Street.<br /><em>A familiar kind of patchy.</em></h1>
          <p>Meet Cherry at 151 Front Street, Brooklyn. A sparse canopy, <br />a small sidewalk practice, and a neighbor who sees <br />something of themselves in its branches.</p>
          <a className="th-primary" href="#patient-story">Hear from a patient <ArrowDown size={17} /></a><Link className="th-provider-link" href="/providers?zip=11201&id=156484">View Cherry’s provider record <ArrowRight size={15} /></Link>
          <div className="th-hero-meta"><span>PRIMARY CARE TREE</span><span>151 FRONT STREET · BROOKLYN 11201</span></div>
        </div>
        <figure className="th-portrait">
          <Image width={1600} height={1481} sizes="(max-width: 650px) 90vw, (max-width: 1280px) 45vw, 540px" priority src="/images/cherry-156484.webp" alt="Cherry at 151 Front Street: sparse leafy branches in a planted sidewalk bed beside a brick building and food cart" />
          <span className="th-photo-label">CHERRY / PRUNUS / #156484</span>
          <div className="th-annotation"><span />A little patchy.<br />Very understanding.</div>
          <figcaption><span>Now seeing neighbors.</span><span>User-supplied Google Street View image</span></figcaption>
        </figure>
      </section>
      <div className="th-file-strip"><span><Trees size={20} /> PROVIDER #156484</span><span><small>Location</small> DUMBO, Brooklyn</span><span><small>Specialty</small> Dermatology / alopecia</span><span><small>Office hours</small> Dawn–dusk, weekdays</span></div>
      <section className="th-intro th-section">
        <div className="th-side-label">ABOUT THE PROVIDER</div>
        <div><h2>Excellent bedside manner.<br /><em>No bedside required.</em></h2><div className="th-two-copy"><p>Cherry stands in a small planted bed outside 151 Front Street. In the photograph, leaves gather at some branch tips while other stretches remain bare. A food cart occupies the curb beside it; a brick storefront is its backdrop. This is the particular canopy that starts the story.</p><p>Its approach is unusually personal. The patient brings a concern about their hair; the tree brings a canopy that is hardly uniform. Together, they establish a practice built around short visits, long silences, and absolutely no before-and-after promises.</p></div></div>
      </section>
      <section className="th-testimonial th-section" id="patient-story">
        <div className="th-side-label">THE PATIENT’S PERSPECTIVE<span>A neighbor on finding<br />their primary care tree.</span><small>FICTIONAL TESTIMONIAL</small></div>
        <div>
          <div className="th-patient-heading"><span>SEEN FOR: ALOPECIA AREATA</span><span>ONGOING CARE</span></div>
          <blockquote>“I wanted a doctor who understood the patchiness. This one had some of its own.”</blockquote>
          <div className="th-story-body">
            <p>I chose the Cherry at 151 Front Street because it was near my home. That was the whole referral process. I used to pass its little planted bed without looking up. Eventually, I started stopping.</p>
            <p>One day I looked up and noticed leaves clustered at the ends of some branches, with long bare stretches in between. I’d spent the morning looking at a patch on my scalp. Suddenly I was looking at another one.</p>
            <p>I pointed at my head, then at the branches. “Patch here. Patch there. Okay. Same department.” That was our first consultation.</p>
            <p>Now I visit on my way home. Sometimes I bring a small mirror. For a moment, my reflection and the branches fit inside the same frame. We both get examined.</p>
            <p>I can’t report any new hair. But I’ve started looking at something other than my scalp. I look at the gaps between its branches, the small bed around its trunk, the shadow it casts against the storefront. There’s always something to follow up on.</p>
          </div>
          <div className="th-patient-signoff"><span className="th-patient-mark">P.</span><div><strong>A neighbor of the Front Street Cherry</strong><span>On choosing a provider close to home</span></div></div>
        </div>
      </section>
      <section className="th-section th-provider-approach">
        <div className="th-side-label">WHY THIS PROVIDER</div>
        <div><h2>A practice with <em>room to grow.</em></h2><dl className="th-qualities"><div><dt><span>01</span> Shared experience</dt><dd>A canopy with gaps makes an unusually good starting point for a conversation about hair loss. No perfect head of leaves to live up to.</dd></div><div><dt><span>02</span> A very local practice</dt><dd>The appointment fits into the walk home. No special journey, no reception desk, and no need to explain yourself from the beginning.</dd></div><div><dt><span>03</span> Continuity of care</dt><dd>Same tree, next week. Familiarity builds one visit at a time, even when there is nothing new to report.</dd></div></dl></div>
      </section>
      <section className="th-prescription-section th-section">
        <div className="th-prescription-copy"><div className="th-eyebrow">FROM THE PROVIDER’S DESK</div><h2>“Come back<br /><em>in spring.”</em></h2><p>The consultation ended with a remarkably short prescription. The patient asked when they could expect results. The provider rustled.</p><p>“It’s not a very reassuring doctor,” the patient says. “But it is very easy to get a follow-up.”</p><button className="th-text-button" onClick={() => window.print()}><Printer size={16} /> Keep a copy of the prescription <ArrowRight size={16} /></button></div>
        <article className="th-prescription"><div className="th-rx-head"><span>PRIMARY CARE TREE<br /><small>CHERRY · PROVIDER #156484</small></span><span className="th-rx">℞</span></div><div className="th-rx-line"><span>Diagnosis</span><strong>Localized canopy loss</strong></div><div className="th-rx-line"><span>Treatment</span><strong>Wait.</strong></div><div className="th-rx-line"><span>Dosage</span><strong>One season</strong></div><div className="th-rx-line"><span>Follow-up</span><strong>Spring</strong></div><div className="th-signature">Signed, the tree.</div><p>Part of a fictional care story. Not a medical prescription.</p></article>
      </section>
      <section className="th-find-provider"><div><div className="th-eyebrow">GOOD CARE MAY BE CLOSER THAN YOU THINK.</div><h2>Who’s growing <em>on your block?</em></h2></div><Link className="th-primary" href="/pcts">Find your primary care tree <ArrowRight size={17} /></Link></section>
    </main>
    <footer className="site-footer">
      <div className="footer-main"><div className="footer-brand"><Image width={60} height={56} src="/images/tree-logo-white.svg" alt="Primary Care Tree" className="footer-logo" /><p>A speculative medical network that allows New York City trees to provide care.</p></div><div className="footer-nav"><span>Network</span><Link href="/">Home</Link><Link href="/#testimonials">Patient notes</Link><Link href="/pcts">Browse providers</Link></div></div>
      <div className="footer-disclaimer"><p>This provider profile and patient story are fiction. PCT is not a real medical service. Trees do not treat alopecia areata.</p></div>
    </footer>
    </>
  );
}
