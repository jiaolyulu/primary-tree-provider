import type { Metadata } from "next";
import { LondonPlanetreeHighlight } from "@/components/LondonPlanetreeHighlight";
import "../highlights.css";

export const metadata: Metadata = {
  title: "Lucy’s London Planetree — Primary Care Tree",
  description: "Seven minutes from Times Square: Lucy visits London Planetree, provider #133645, in a fictional care story about burnout and Bryant Park shade.",
};

export default function LondonPlanetreePage() {
  return <LondonPlanetreeHighlight />;
}
