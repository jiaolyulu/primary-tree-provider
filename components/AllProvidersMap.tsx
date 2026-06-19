"use client";

import { useEffect, useRef, useState } from "react";

export type MapProviderTree = {
  id: number;
  lat: number;
  lng: number;
  zip: string;
  name: string;
  scientific?: string;
  address?: string;
  neighborhood?: string;
};

type AllProvidersMapProps = {
  filteredTrees?: MapProviderTree[] | null;
  filterQuery?: string;
  filterTotal?: number;
  isSearchLoading?: boolean;
  searchError?: boolean;
};

function apiBaseUrl(): string {
  if (typeof window === "undefined") return "http://127.0.0.1:8000";
  const { hostname } = window.location;
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  return isLocal ? "http://127.0.0.1:8000" : "/_/backend";
}

export function AllProvidersMap({
  filteredTrees = null,
  filterQuery = "",
  filterTotal = 0,
  isSearchLoading = false,
  searchError = false,
}: AllProvidersMapProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const allTreesRef = useRef<MapProviderTree[]>([]);
  const activeTreesRef = useRef<MapProviderTree[]>([]);
  const updateMarkersRef = useRef<(() => void) | null>(null);
  const previousFilterSignatureRef = useRef("");
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [visibleCount, setVisibleCount] = useState(0);
  const [markerTotal, setMarkerTotal] = useState(0);
  const hasActiveFilter = filterQuery.trim().length >= 2;

  // Load all provider coordinates from the backend (guaranteed to have profiles)
  useEffect(() => {
    fetch(`${apiBaseUrl()}/api/providers/coords`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { coords: [number, number, number, string, string][] }) => {
        allTreesRef.current = data.coords.map(([id, lat, lng, zip, name]) => ({ id, lat, lng, zip, name }));
        activeTreesRef.current = allTreesRef.current;
        setMarkerTotal(allTreesRef.current.length);
        setLoadStatus("ready");
      })
      .catch(() => setLoadStatus("error"));
  }, []);

  // Initialize Leaflet map once data is ready
  useEffect(() => {
    if (loadStatus !== "ready" || !containerRef.current) return;
    let cancelled = false;

    async function initMap() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [40.73, -73.95],
        zoom: 12,
        scrollWheelZoom: true,
        touchZoom: true,
        wheelDebounceTime: 32,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);
      layerRef.current = layer;
      mapRef.current = map;

      const updateMarkers = () => {
        const bounds = map.getBounds();
        const all = activeTreesRef.current;

        const inBounds: MapProviderTree[] = [];
        for (const tree of all) {
          if (bounds.contains([tree.lat, tree.lng])) {
            inBounds.push(tree);
          }
        }

        // Evenly sample up to 200 so markers are spread across the viewport
        const MAX = 200;
        const visible =
          inBounds.length <= MAX
            ? inBounds
            : inBounds.filter((_, i) => i % Math.ceil(inBounds.length / MAX) === 0).slice(0, MAX);

        layer.clearLayers();
        for (const tree of visible) {
          const tooltip = [tree.name, tree.scientific, tree.neighborhood, tree.address].filter(Boolean).join(" · ");
          const marker = L.circleMarker([tree.lat, tree.lng], {
            radius: 5,
            fillColor: "#00471f",
            color: "#ffffff",
            weight: 1,
            fillOpacity: 0.85,
          })
            .bindTooltip(tooltip, { direction: "top", opacity: 0.95 })
            .addTo(layer);

          const { id, zip, lat, lng } = tree;
          marker.on("click", () => {
            window.location.href = `/providers?zip=${zip}&lat=${lat}&lng=${lng}&location=pin&id=${id}`;
          });
          marker.on("mouseover", () => marker.setStyle({ radius: 7, fillColor: "#007a34" }));
          marker.on("mouseout", () => marker.setStyle({ radius: 5, fillColor: "#00471f" }));
        }

        setVisibleCount(inBounds.length);
        setMarkerTotal(all.length);
      };

      updateMarkersRef.current = updateMarkers;
      map.on("moveend zoomend", updateMarkers);
      updateMarkers();
    }

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      updateMarkersRef.current = null;
    };
  }, [loadStatus]);

  useEffect(() => {
    if (loadStatus !== "ready") return;

    const nextTrees = hasActiveFilter ? filteredTrees ?? [] : allTreesRef.current;
    activeTreesRef.current = nextTrees;
    setMarkerTotal(nextTrees.length);
    setVisibleCount(0);
    updateMarkersRef.current?.();

    const map = mapRef.current;
    const filterSignature = hasActiveFilter
      ? `${filterQuery}:${nextTrees.length}:${nextTrees[0]?.id ?? ""}:${nextTrees[nextTrees.length - 1]?.id ?? ""}`
      : filterQuery;

    if (!map || !nextTrees.length || previousFilterSignatureRef.current === filterSignature) {
      previousFilterSignatureRef.current = filterSignature;
      return;
    }

    previousFilterSignatureRef.current = filterSignature;
    if (!hasActiveFilter) return;

    import("leaflet").then((L) => {
      const bounds = L.latLngBounds(nextTrees.map((tree) => [tree.lat, tree.lng] as [number, number]));
      map.fitBounds(bounds, { animate: true, maxZoom: 15, padding: [36, 36] });
    });
  }, [filterQuery, filteredTrees, hasActiveFilter, loadStatus]);

  if (loadStatus === "error") {
    return (
      <p className="all-providers-map-error">
        Map unavailable — provider data could not be loaded.
      </p>
    );
  }

  return (
    <div className="all-providers-map-canvas">
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
        aria-label="NYC provider tree network map"
      />
      {loadStatus === "loading" && (
        <div className="all-providers-map-loading">Loading provider network…</div>
      )}
      {loadStatus === "ready" && isSearchLoading && (
        <div className="all-providers-map-loading">Filtering provider network…</div>
      )}
      {loadStatus === "ready" && searchError && (
        <div className="all-providers-map-count">Search unavailable. Showing the last map state.</div>
      )}
      {loadStatus === "ready" && markerTotal === 0 && hasActiveFilter && !isSearchLoading && (
        <div className="all-providers-map-count">No matching providers on map</div>
      )}
      {loadStatus === "ready" && markerTotal > 0 && !isSearchLoading && (
        <div className="all-providers-map-count">
          {hasActiveFilter
            ? visibleCount <= 200
              ? `${visibleCount.toLocaleString()} matching providers in view`
              : `Showing 200 of ${visibleCount.toLocaleString()} matches in view`
            : visibleCount <= 200
            ? `${visibleCount.toLocaleString()} providers in view`
            : `Showing 200 of ${visibleCount.toLocaleString()} — zoom in to see more`}
          {hasActiveFilter && filterTotal > markerTotal ? ` · ${markerTotal.toLocaleString()} of ${filterTotal.toLocaleString()} loaded` : ""}
        </div>
      )}
    </div>
  );
}
