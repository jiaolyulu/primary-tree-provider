import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { TreeThumb } from "@/components/TreeThumb";
import { careTaxonomy } from "@/lib/careTaxonomy";

export const metadata: Metadata = {
  title: "Browse all PCTs — Primary Care Tree",
  description: "Every tree-provider species in the network and the care specialty it practices.",
};

const totalSpecies = careTaxonomy.reduce(
  (sum, group) => sum + group.specialties.reduce((count, entry) => count + entry.trees.length, 0),
  0,
);

export default function BrowseAllPcts() {
  return (
    <main className="pct-directory-page">
      <SiteNav variant="solid" cta={{ href: "/providers?zip=11215", label: "Find a PCT" }} />

      <section className="pct-directory-intro">
        <span>The PCT network</span>
        <h1>
          Every tree doctor, by <em>specialty</em>.
        </h1>
        <p>
          Each species in the network practices a kind of care. Browse the {totalSpecies} provider species below —
          grouped by what the body needs — then find one rooted near you.
        </p>
      </section>

      {careTaxonomy.map((group) => (
        <section key={group.category} className="pct-directory-group">
          <div className="pct-group-head">
            <h2>{group.category}</h2>
            <p>{group.summary}</p>
          </div>
          <div className="pct-card-grid">
            {group.specialties.flatMap((entry) =>
              entry.trees.map((tree) => (
                <article key={`${entry.specialty}-${tree}`} className="pct-card">
                  <TreeThumb name={tree} />
                  <span className="pct-card-specialty">{entry.specialty}</span>
                  <h3>{tree}</h3>
                  <div className="condition-chips pct-card-conditions">
                    {entry.conditions.map((condition) => (
                      <span key={condition}>{condition}</span>
                    ))}
                  </div>
                  <Link
                    className="pct-card-link"
                    href={`/providers?zip=11215&symptom=${encodeURIComponent(entry.conditions[0])}`}
                  >
                    Find a {tree} near you
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </article>
              )),
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
