"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/#about", label: "About" },
  { href: "/#faq", label: "Q&A" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#featured-doctors", label: "Tree Map" },
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
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
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
