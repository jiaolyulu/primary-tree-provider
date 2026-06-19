"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AllProvidersMap, type MapProviderTree } from "@/components/AllProvidersMap";
import {
  browseProviderSearch,
  providerNetworkStats,
  type ProviderBrowseSearchResult,
} from "@/lib/providers";

const MAP_RESULT_LIMIT = 10000;

function mapTreeFromProvider(provider: ProviderBrowseSearchResult): MapProviderTree {
  return {
    id: provider.providerId,
    lat: provider.clinicLatitude,
    lng: provider.clinicLongitude,
    zip: provider.clinicZipcode,
    name: provider.speciesCommon,
    scientific: provider.speciesScientific,
    address: `${provider.clinicAddress}, ${provider.clinicCity}, ${provider.clinicState} ${provider.clinicZipcode}`,
    neighborhood: provider.clinicNeighborhood,
  };
}

export function PctDirectorySearch() {
  const [query, setQuery] = useState("");
  const [mapTrees, setMapTrees] = useState<MapProviderTree[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setMapTrees([]);
      setTotalMatches(0);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    setMapTrees([]);
    setTotalMatches(0);
    setStatus("loading");
    const timer = window.setTimeout(() => {
      browseProviderSearch(trimmedQuery, MAP_RESULT_LIMIT, controller.signal)
        .then((payload) => {
          setMapTrees(payload.results.map(mapTreeFromProvider));
          setTotalMatches(payload.totalMatches);
          setStatus("ready");
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setMapTrees([]);
          setTotalMatches(0);
          setStatus("error");
        });
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  const statusText = useMemo(() => {
    if (status === "loading") return "Searching...";
    if (status === "error") return "Search unavailable.";
    if (status === "ready" && totalMatches === 0) return "No matches found.";
    if (status === "ready") {
      return totalMatches > mapTrees.length
        ? `${mapTrees.length.toLocaleString()} of ${totalMatches.toLocaleString()} matches mapped`
        : `${totalMatches.toLocaleString()} ${totalMatches === 1 ? "match" : "matches"} mapped`;
    }
    return `${providerNetworkStats.totalProviders.toLocaleString()} active provider trees`;
  }, [mapTrees.length, status, totalMatches]);

  return (
    <section className="pct-directory-search" aria-label="Search provider map">
      <div className="pct-directory-search-row">
        <div>
          <span>Provider search</span>
          <p className="pct-search-status" role="status" aria-live="polite">
            {statusText}
          </p>
        </div>

        <div className="pct-search-box">
          <Search aria-hidden="true" size={19} />
          <label htmlFor="pct-directory-search-input" className="sr-only">
            Search all PCTs
          </label>
          <input
            id="pct-directory-search-input"
            type="search"
            value={query}
            placeholder="Asthma, Cardiology, Park Slope, Acer rubrum, Gold St"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button type="button" className="pct-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <X aria-hidden="true" size={18} />
            </button>
          ) : null}
        </div>
      </div>

      <AllProvidersMap
        filteredTrees={trimmedQuery.length >= 2 ? mapTrees : null}
        filterQuery={trimmedQuery}
        filterTotal={totalMatches}
        isSearchLoading={status === "loading"}
        searchError={status === "error"}
      />
    </section>
  );
}
