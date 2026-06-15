import type { ProviderMatch } from "@/lib/providers";

export const FALLBACK_TREE_IMAGE = "/images/pct-tree-hero.jpg";

type TreeImageSource = {
  credit: string;
  license: string;
  licenseUrl: string;
  patterns: string[];
  sourceUrl: string;
  url: string;
};

export const CURATED_TREE_IMAGES: TreeImageSource[] = [
  {
    patterns: ["linden", "tilia"],
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Tilia%20cordata%20-%20%27Greenspire%27%20littleleaf%20linden.jpg?width=500",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tilia_cordata_-_%27Greenspire%27_littleleaf_linden.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    credit: "Wikimedia Commons contributor",
  },
  {
    patterns: ["ginkgo", "ginkgo biloba"],
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Ginkgo-biloba-tree-in-fall.jpg?width=500",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ginkgo-biloba-tree-in-fall.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    credit: "Wikimedia Commons contributor",
  },
  {
    patterns: ["sophora", "pagoda", "styphnolobium"],
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/20120905Styphnolobium%20japonicum.jpg?width=500",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:20120905Styphnolobium_japonicum.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    credit: "Wikimedia Commons contributor",
  },
  {
    patterns: ["oak", "quercus"],
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Pin%20oak%20quercus%20palustris.jpg?width=500",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Pin_oak_quercus_palustris.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    credit: "Wikimedia Commons contributor",
  },
  {
    patterns: ["zelkova"],
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Zelkova%20serrata%20entire.jpg?width=500",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Zelkova_serrata_entire.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    credit: "Wikimedia Commons contributor",
  },
  {
    patterns: ["sweetgum", "liquidambar"],
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/E20151113-0001%E2%80%94Liquidambar%20styraciflua%E2%80%94Berkelely%20%2822378349813%29.jpg?width=500",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:E20151113-0001%E2%80%94Liquidambar_styraciflua%E2%80%94Berkelely_(22378349813).jpg",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    credit: "John Rusk from Berkeley, CA, United States of America",
  },
  {
    patterns: ["lilac", "syringa"],
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Syringa%20reticulata%20tree.jpg?width=500",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Syringa_reticulata_tree.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    credit: "Wikimedia Commons contributor",
  },
  {
    patterns: ["honeylocust", "honey locust", "gleditsia"],
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Gleditsia%20triacanthos%20var.%20inermis%20Christie%200zz.jpg?width=500",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Gleditsia_triacanthos_var._inermis_Christie_0zz.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    credit: "Photo by David J. Stang",
  },
];

export function getTreeImageForSpecies(speciesCommon: string, speciesScientific = "") {
  const searchText = `${speciesCommon} ${speciesScientific}`.toLowerCase();
  return CURATED_TREE_IMAGES.find((source) => source.patterns.some((pattern) => searchText.includes(pattern)))?.url ?? FALLBACK_TREE_IMAGE;
}

export function getTreeImageForProvider(provider: ProviderMatch) {
  return getTreeImageForSpecies(provider.speciesCommon, provider.speciesScientific);
}
