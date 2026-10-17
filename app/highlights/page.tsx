import type { Metadata } from "next";
import { TreeHighlight } from "@/components/TreeHighlight";
import "./highlights.css";

export const metadata: Metadata = {
  title: "Cherry at 151 Front Street — Primary Care Tree",
  description: "Meet Cherry, provider 156484 at 151 Front Street in Brooklyn, through a fictional patient story about alopecia and a familiar sparse canopy.",
};

export default function HighlightsPage() {
  return <TreeHighlight />;
}
