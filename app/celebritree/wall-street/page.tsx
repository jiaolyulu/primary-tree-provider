import type { Metadata } from "next";
import { LittleleafLindenHighlight } from "@/components/LittleleafLindenHighlight";
import "../../highlights/highlights.css";

export const metadata: Metadata = {
  title: "Celebritree — A finance bro under a linden",
  description: "Meet Littleleaf Linden, provider #283429 at 210 South End Avenue in Battery Park City, through a fictional patient story about anxiety, low mood, and insomnia.",
};

export default function WallStreetPage() {
  return <LittleleafLindenHighlight />;
}
