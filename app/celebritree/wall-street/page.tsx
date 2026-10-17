import type { Metadata } from "next";
import { Trees } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { CelebritreeFooter, CelebritreeHeader, CelebritreeMore } from "@/components/CelebritreeNavigation";
import "../../highlights/highlights.css";

export const metadata: Metadata = { title: "Celebritree — The Wall Street tree", description: "A future Celebritree story: a tree caring for the finance crowd on Wall Street." };

export default function WallStreetPage() {
  return <><SiteNav variant="solid" /><main className="th-page">
    <CelebritreeHeader current="wall-street" />
    <section className="th-hero">
      <div className="th-hero-copy"><div className="th-eyebrow">STORY COMING SOON</div><h1>The Wall Street tree.<br /><em>Care after the closing bell.</em></h1><p>A neighborhood practice for the finance crowd. This third Celebritree will get its own provider portrait and patient story.</p><p>The tree’s identity, photograph, and full story are still to come.</p><a className="th-primary" href="#other-stories">Meet the other Celebritrees ↓</a></div>
      <div className="celebritree-pending" aria-label="Tree portrait to come"><Trees size={90} strokeWidth={1} /><span>WALL STREET / PORTRAIT TO COME</span></div>
    </section>
    <div id="other-stories"><CelebritreeMore current="wall-street" /></div>
  </main><CelebritreeFooter /></>;
}
