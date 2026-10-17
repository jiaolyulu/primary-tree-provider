import type { Metadata } from "next";
import { TreeHighlight } from "@/components/TreeHighlight";
import "../../highlights/highlights.css";
export const metadata: Metadata = { title: "Celebritree — Cherry on Front Street", description: "Meet the trees behind the patient stories. First up: Cherry at 151 Front Street." };
export default function CelebritreePage() { return <TreeHighlight />; }
