import type { Metadata } from "next";
import { LondonPlanetreeHighlight } from "@/components/LondonPlanetreeHighlight";
import "../../highlights/highlights.css";
export const metadata: Metadata = { title: "Celebritree — Lucy’s London Planetree", description: "Lucy’s visit to London Planetree, seven minutes from Times Square." };
export default function LondonPlanetreePage() { return <LondonPlanetreeHighlight />; }
