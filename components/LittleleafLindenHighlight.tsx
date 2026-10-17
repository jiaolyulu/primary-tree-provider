"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Printer, Trees } from "lucide-react";
import { CelebritreeFooter, CelebritreeHeader, CelebritreeMore } from "@/components/CelebritreeNavigation";
import { SiteNav } from "@/components/SiteNav";

export function LittleleafLindenHighlight() {
  return (
    <>
      <SiteNav variant="solid" />
      <main className="th-page th-linden">
        <CelebritreeHeader current="wall-street" />
        <section className="th-hero">
          <div className="th-hero-copy">
            <div className="th-eyebrow"><span className="th-dot" /> FEATURED PROVIDER / #283429</div>
            <h1>A finance bro under a linden.<br /><em>A gentler kind of stress test.</em></h1>
            <p>Meet Littleleaf Linden at 210 South End Avenue, Battery Park City. A quiet canopy, a short walk from the Financial District, and a patient whose nervous system has been working longer hours than he has.</p>
            <a className="th-primary" href="#patient-story">Hear from the patient <ArrowDown size={17} /></a>
            <Link className="th-provider-link" href="/providers?zip=10280&id=283429">View Linden’s provider record <ArrowRight size={15} /></Link>
            <div className="th-hero-meta"><span>PRIMARY CARE TREE</span><span>210 SOUTH END AVENUE · NEW YORK, NY 10280</span></div>
          </div>
          <figure className="th-portrait">
            <Image
              src="/images/linden-283429.jpg"
              width={1286}
              height={1500}
              sizes="(max-width: 900px) 90vw, (max-width: 1280px) 45vw, 540px"
              priority
              alt="Littleleaf Linden at 210 South End Avenue, with a broad green canopy above the Battery Park City sidewalk"
            />
            <span className="th-photo-label">LINDEN / TILIA / #283429</span>
            <figcaption><span>Now seeing deal teams.</span><span>User-supplied Google Street View image</span></figcaption>
          </figure>
        </section>
        <div className="th-file-strip">
          <span><Trees size={20} /> PROVIDER #283429</span>
          <span><small>Location</small> Battery Park City, Lower Manhattan</span>
          <span><small>Specialty</small> Psychiatry / anxiety, depression, insomnia</span>
          <span><small>Office hours</small> Dawn–dusk, weekdays</span>
        </div>
        <section className="th-intro th-section">
          <div className="th-side-label">ABOUT THE PROVIDER</div>
          <div>
            <h2>Calm under pressure.<br /><em>No mindfulness app required.</em></h2>
            <div className="th-two-copy">
              <p>Linden is assigned to psychiatry because everything about it feels slower than the city around it. Its broad canopy creates a sheltered room above the sidewalk. Its leaves move gently in the wind, sometimes flashing their pale undersides, while its flowers add a faint sweetness to the air.</p>
              <p>For someone dealing with anxiety, low mood, or insomnia, the linden offers the opposite of another urgent notification: shade, stillness, and absolutely nothing that needs to be turned into a presentation.</p>
              <p>This particular tree stands in Battery Park City, close enough to the Financial District for a patient to visit between meetings—or immediately after pretending that a three-hour night of sleep is “pretty standard during a live deal.”</p>
            </div>
          </div>
        </section>
        <section className="th-testimonial th-section" id="patient-story">
          <div className="th-side-label">THE PATIENT’S PERSPECTIVE<span>A finance bro on finding his primary care tree.</span><small>FICTIONAL TESTIMONIAL</small></div>
          <div>
            <div className="th-patient-heading"><span>SEEN FOR: ANXIETY, LOW MOOD, INSOMNIA &amp; “A SENSE OF URGENCY”</span><span><time dateTime="2026-10-08">OCTOBER 8, 2026</time></span></div>
            <blockquote>“I wanted a doctor who stayed calm during market volatility. This one had leaves.”</blockquote>
            <div className="th-story-body">
              <p>I had just finished working on the Paramountly Warner Bros. Discovery merger at Goldman Stanley. For six months, I slept three hours a night, ate dinner from conference-room containers, and became personally offended whenever someone said, “Just one small change.”</p>
              <p>My colleagues said I seemed tense. I explained that I was not tense. I was simply communicating at a higher level of urgency.</p>
              <p>Then I yelled at an analyst because the blue in the presentation was not “confident enough.”</p>
              <p>That evening, at 3:14 a.m., I searched for help between edits to the merger model. Primary Care Tree asked what I was experiencing. I selected anxiety, low mood, and insomnia. I considered selecting anger, but decided that was more of a team performance issue.</p>
              <p>The website sent me to psychiatry. Psychiatry sent me to linden.</p>
              <p>It explained that linden trees are paired with this specialty because their shade feels protected, their movement feels gentle, and their overall energy is reassuringly unproductive.</p>
              <p>Then it showed me a Littleleaf Linden on South End Avenue—one coffee-length walk from the office.</p>
              <p>The next afternoon, I told the deal team I had an external meeting and walked to Battery Park City. I stood beneath the canopy and gave the tree a complete update on the transaction.</p>
              <p>The tree did not interrupt.</p>
              <p>It did not ask for sensitivities.</p>
              <p>It did not say, “Can we make this more punchy?”</p>
              <p>After four minutes, I realized my jaw had been clenched since Tuesday.</p>
              <p>Now I visit on my way home. Sometimes I sit beneath the branches. Sometimes I just stand there and watch the leaves move while my phone vibrates in my pocket.</p>
              <p>I cannot say that I have become a relaxed person. But I have eaten several lunches away from my desk, slept before midnight twice, and stopped describing human emotions as execution risks.</p>
              <p>In my business, that is material progress.</p>
            </div>
            <div className="th-patient-signoff"><span className="th-patient-mark">C.B.P.</span><div><strong>C.B.P.</strong><span>Vice President, Goldman Stanley</span><span>On selecting a provider within walking distance of his inbox</span></div></div>
          </div>
        </section>
        <section className="th-section th-provider-approach">
          <div className="th-side-label">WHY THIS PROVIDER</div>
          <div>
            <h2>The right specialist.<br /><em>The right species. The right block.</em></h2>
            <dl className="th-qualities">
              <div><dt><span>01</span> Why linden gets psychiatry</dt><dd>Linden feels gentle and calming—the kind of tree you sit beneath when your nervous system needs quiet. Its sheltered canopy and softly moving leaves make it a natural match for stories about anxiety, depression, insomnia, and emotional overload.</dd></div>
              <div><dt><span>02</span> Close enough to actually visit</dt><dd>The South End Avenue practice is just outside the Financial District. No special journey is required. The appointment can fit between the closing call and the meeting about the meeting.</dd></div>
              <div><dt><span>03</span> A different kind of attention</dt><dd>The tree does not react to urgency. It offers no market alerts, no red notifications, and no follow-up email beginning with “per my last message.” Its silence gives the patient enough room to hear himself think.</dd></div>
            </dl>
          </div>
        </section>
        <section className="th-prescription-section th-section">
          <div className="th-prescription-copy">
            <div className="th-eyebrow">FROM THE PROVIDER’S DESK</div>
            <h2>“Stand here<br /><em>for four minutes.”</em></h2>
            <p>The patient asked if four minutes beneath a tree could be considered a real appointment.</p>
            <p>The linden rustled.</p>
            <p>He added it to his calendar as a recurring meeting.</p>
            <button className="th-text-button" onClick={() => window.print()}><Printer size={16} /> Keep a copy of the prescription <ArrowRight size={16} /></button>
          </div>
          <article className="th-prescription">
            <div className="th-rx-head"><span>PRIMARY CARE TREE<br /><small>LINDEN · PROVIDER #283429</small></span><span className="th-rx">℞</span></div>
            <div className="th-rx-line"><span>Diagnosis</span><strong>Too many tabs open—in the browser and in the brain</strong></div>
            <div className="th-rx-line"><span>Treatment</span><strong>Shade, lunch, and one walk without checking email</strong></div>
            <div className="th-rx-line"><span>Dosage</span><strong>Four quiet minutes</strong></div>
            <div className="th-rx-line"><span>Follow-up</span><strong>Next weekday, preferably before market close</strong></div>
            <div className="th-signature">Signed, the tree.</div>
            <p>Part of a fictional care story. Not a medical prescription.</p>
          </article>
        </section>
        <CelebritreeMore current="wall-street" />
      </main>
      <CelebritreeFooter disclaimer="This provider profile and patient story are fiction. PCT is not a real medical service. Trees do not treat anxiety, depression, or insomnia." />
    </>
  );
}
