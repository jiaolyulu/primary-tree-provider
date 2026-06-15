"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/#about", label: "About" },
  { href: "/#faq", label: "Q&A" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#featured-doctors", label: "Specialty Map" },
];

type SiteNavProps = {
  // The right-hand call to action; defaults to the "Browse all PCTs" directory link.
  cta?: { href: string; label: string };
  // "overlay" sits transparently over the hero; "solid" is a standalone green bar.
  variant?: "overlay" | "solid";
};

export function SiteNav({
  cta = { href: "/pcts", label: "Browse all PCTs" },
  variant = "overlay",
}: SiteNavProps = {}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // For in-page anchors, scroll the element directly instead of relying on the
  // native hash jump, which mis-targets with smooth scrolling + lazy-loaded
  // images. Cross-page links fall through to normal navigation (HashScroll on
  // the landing page handles the scroll once it loads).
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;
    const id = href.slice(hashIndex + 1);
    const path = href.slice(0, hashIndex) || "/";
    if (window.location.pathname !== path) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav className={variant === "solid" ? "nav nav-solid" : "nav"}>
      <Link href="/" className="nav-logo" aria-label="Primary Care Tree — home">
        <img src="/images/tree-logo.svg" alt="Primary Care Tree" />
      </Link>

      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
      </button>

      <div className={open ? "nav-right is-open" : "nav-right"}>
        <div className="nav-links">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={(event) => handleNavClick(event, link.href)}>
              {link.label}
            </a>
          ))}
        </div>
        <Link href={cta.href} className="nav-cta" onClick={() => setOpen(false)}>
          {cta.label}
        </Link>
      </div>
    </nav>
  );
}
