"use client";

import { useEffect, useRef, useState } from "react";

type SlimTree = { id: number; lat: number; lng: number; zip: string; name: string };

function apiBaseUrl(): string {
  if (typeof window === "undefined") return "http://127.0.0.1:8000";
  const { hostname } = window.location;
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  return isLocal ? "http://127.0.0.1:8000" : "/_/backend";
}

export function AllProvidersMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const allTreesRef = useRef<SlimTree[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [visibleCount, setVisibleCount] = useState(0);

  // Load all provider coordinates from the backend (guaranteed to have profiles)
  useEffect(() => {
    fetch(`${apiBaseUrl()}/api/providers/coords`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { coords: [number, number, number, string, string][] }) => {
        allTreesRef.current = data.coords.map(([id, lat, lng, zip, name]) => ({ id, lat, lng, zip, name }));
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
        scrollWheelZoom: false,
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
        const all = allTreesRef.current;

        const inBounds: SlimTree[] = [];
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
          const marker = L.circleMarker([tree.lat, tree.lng], {
            radius: 5,
            fillColor: "#00471f",
            color: "#ffffff",
            weight: 1,
            fillOpacity: 0.85,
          })
            .bindTooltip(tree.name, { direction: "top", opacity: 0.95 })
            .addTo(layer);

          const { id, zip, lat, lng } = tree;
          marker.on("click", () => {
            window.location.href = `/providers?zip=${zip}&lat=${lat}&lng=${lng}&location=pin&id=${id}`;
          });
          marker.on("mouseover", () => marker.setStyle({ radius: 7, fillColor: "#007a34" }));
          marker.on("mouseout", () => marker.setStyle({ radius: 5, fillColor: "#00471f" }));
        }

        setVisibleCount(inBounds.length);
      };

      map.on("moveend zoomend", updateMarkers);
      updateMarkers();
    }

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [loadStatus]);

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
      {loadStatus === "ready" && visibleCount > 0 && (
        <div className="all-providers-map-count">
          {visibleCount <= 200
            ? `${visibleCount} providers in view`
            : `Showing 200 of ${visibleCount.toLocaleString()} — zoom in to see more`}
        </div>
      )}
    </div>
  );
}
