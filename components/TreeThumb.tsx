"use client";

import { useEffect, useState } from "react";
import { FALLBACK_TREE_IMAGE, getTreeImageForSpecies } from "@/lib/treeImageSources";

const cache = new Map<string, string>();

// Species whose common name lands on a Wikipedia disambiguation page; pin a real article.
const TITLE_OVERRIDES: Record<string, string> = {
  "White Pine": "Eastern white pine",
  Hawthorn: "Crataegus",
};

// Lazily resolves a real photo for a tree species (by common name) from Wikipedia,
// caching per name and falling back to the house tree image.
export function TreeThumb({ name, className = "pct-card-img" }: { name: string; className?: string }) {
  const fallback = getTreeImageForSpecies(name);
  const [src, setSrc] = useState(() => cache.get(name) ?? fallback);

  useEffect(() => {
    const curated = getTreeImageForSpecies(name);
    if (curated !== FALLBACK_TREE_IMAGE) {
      cache.set(name, curated);
      setSrc(curated);
      return;
    }

    const cached = cache.get(name);
    if (cached) {
      setSrc(cached);
      return;
    }
    setSrc(fallback);
    let active = true;

    const trimmed = name.trim();
    const sentenceCase = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    const deHyphen = sentenceCase.replace(/-/g, " ");
    const override = TITLE_OVERRIDES[trimmed];
    const variants = [...new Set([override, trimmed, sentenceCase, deHyphen, `${deHyphen} (tree)`].filter(Boolean) as string[])];

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
  }, [fallback, name]);

  return <img className={className} src={src} alt={`${name} tree`} loading="lazy" />;
}
