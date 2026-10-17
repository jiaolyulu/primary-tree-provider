import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trees } from "lucide-react";

const stories = [
  { id: "cherry", number: "01", title: "Cherry on Front Street", location: "DUMBO, Brooklyn", description: "A familiar kind of patchy. A neighbor finds an unlikely hair specialist.", href: "/celebritree/cherry", image: "/images/cherry-156484.webp" },
  { id: "london-planetree", number: "02", title: "Lucy’s London Planetree", location: "Bryant Park, Manhattan", description: "Seven minutes from Times Square. A little shade and a reason to leave.", href: "/celebritree/london-planetree", image: "/images/london-planetree-133645.webp" },
  { id: "wall-street", number: "03", title: "A finance bro under a linden", location: "Battery Park City, Manhattan", description: "A gentler kind of stress test. A finance bro finds a calmer provider on South End Avenue.", href: "/celebritree/wall-street", image: "/images/linden-283429.jpg" },
] as const;

type StoryId = typeof stories[number]["id"];

export function CelebritreeHeader({ current }: { current: StoryId }) {
  const story = stories.find((item) => item.id === current)!;
  return <div className="th-issue"><Link href="/#testimonials">← Patient notes</Link><span>CELEBRITREE / {story.number} OF 03</span></div>;
}

export function CelebritreeMore({ current }: { current: StoryId }) {
  return <nav className="celebritree-more" aria-label="Explore the other Celebritrees">
    <div className="th-eyebrow">CELEBRITREE / KEEP EXPLORING</div>
    <h2>Meet the other <em>two.</em></h2>
    <div className="celebritree-options">{stories.filter((story) => story.id !== current).map((story) => (
      <Link key={story.id} href={story.href} className="celebritree-option">
        <div className="celebritree-option-photo">{story.image ? <Image src={story.image} alt={story.title} fill sizes="(max-width: 650px) 90vw, 45vw" /> : <><Trees size={52} strokeWidth={1} /><span>Portrait to come</span></>}</div>
        <div className="celebritree-option-copy"><span>{story.number} / {story.location}</span><h3>{story.title}</h3><p>{story.description}</p><strong>{story.image ? "Read the story" : "Visit the preview"}<ArrowRight size={18} aria-hidden="true" /></strong></div>
      </Link>
    ))}</div>
  </nav>;
}

export function CelebritreeFooter({ disclaimer = "This provider profile and patient story are fiction. PCT is not a real medical service." }: { disclaimer?: string }) {
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand"><Image width={60} height={56} src="/images/tree-logo-white.svg" alt="Primary Care Tree" className="footer-logo" /><p>A speculative medical network that allows New York City trees to provide care.</p></div>
      <div className="footer-nav"><span>Network</span><Link href="/">Home</Link><Link href="/#testimonials">Patient notes</Link><Link href="/pcts">Browse providers</Link></div>
    </div>
    <div className="footer-disclaimer"><p>{disclaimer}</p></div>
  </footer>;
}
