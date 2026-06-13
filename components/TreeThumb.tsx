"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, string>();
const FALLBACK = "/images/pct-tree-hero.jpg";

// Lazily resolves a real photo for a tree species (by common name) from Wikipedia,
// caching per name and falling back to the house tree image.
export function TreeThumb({ name }: { name: string }) {
  const [src, setSrc] = useState(() => cache.get(name) ?? FALLBACK);

  useEffect(() => {
    const cached = cache.get(name);
    if (cached) {
      setSrc(cached);
      return;
    }
    let active = true;

    const trimmed = name.trim();
    const sentenceCase = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    const deHyphen = sentenceCase.replace(/-/g, " ");
    const variants = [...new Set([trimmed, sentenceCase, deHyphen, `${deHyphen} (tree)`])];

    const resolve = async () => {
      for (const variant of variants) {
        const title = encodeURIComponent(variant.replace(/\s+/g, "_"));
        try {
          const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
          if (!response.ok) continue;
          const data = await response.json();
          if (data?.type === "disambiguation") continue;
          const url: string | undefined = data?.thumbnail?.source ?? data?.originalimage?.source;
          if (url) {
            cache.set(name, url);
            if (active) setSrc(url);
            return;
          }
        } catch {
          // try the next variant
        }
      }
    };

    resolve();
    return () => {
      active = false;
    };
  }, [name]);

  return <img className="pct-card-img" src={src} alt={`${name} tree`} loading="lazy" />;
}
