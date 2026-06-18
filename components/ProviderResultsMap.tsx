"use client";

import type { DivIcon, LatLngBoundsExpression, LatLngExpression, Map as LeafletMap, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { ProviderMatch } from "@/lib/providers";

export function ProviderResultsMap({
  providers,
  selectedProviderId,
  onSelectProvider,
}: {
  providers: ProviderMatch[];
  selectedProviderId: number;
  onSelectProvider: (providerId: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const onSelectProviderRef = useRef(onSelectProvider);
  const providerIdsRef = useRef("");
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    onSelectProviderRef.current = onSelectProvider;
  }, [onSelectProvider]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const firstProvider = providers[0];
      const initialPosition: LatLngExpression = firstProvider
        ? [firstProvider.clinicLatitude, firstProvider.clinicLongitude]
        : [40.7128, -74.006];
      const map = L.map(containerRef.current, {
        attributionControl: false,
        maxZoom: 18,
        minZoom: 10,
        scrollWheelZoom: false,
        zoomDelta: 0.5,
        zoomSnap: 0.5,
        zoomControl: true,
      }).setView(initialPosition, 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setIsMapReady(true);
    }

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
      providerIdsRef.current = "";
    };
    // Mount-only: the map is created once and `providers` is read solely for the
    // initial center. Marker updates are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncMarkers() {
      const map = mapRef.current;
      if (!map || !isMapReady) return;

      const L = await import("leaflet");
      if (cancelled) return;

      markersRef.current.forEach((marker) => marker.remove());
      const providerIds = providers
        .map((provider) => provider.providerId)
        .sort((left, right) => left - right)
        .join(",");
      const shouldFitResults = providerIds !== providerIdsRef.current;
      providerIdsRef.current = providerIds;

      markersRef.current = providers.map((provider, index) => {
        const isSelected = provider.providerId === selectedProviderId;
        const icon: DivIcon = L.divIcon({
          className: `pct-provider-map-marker${isSelected ? " selected" : ""}`,
          html: `<span>${index + 1}</span>`,
          iconAnchor: [18, 18],
          iconSize: [36, 36],
        });
        const marker = L.marker([provider.clinicLatitude, provider.clinicLongitude], {
          icon,
          keyboard: true,
          title: `${index + 1}. ${provider.speciesCommon}`,
        }).addTo(map);

        marker.bindTooltip(provider.speciesCommon, {
          className: "pct-provider-map-tooltip",
          direction: "top",
          offset: [0, -18],
          opacity: 0.96,
        });
        marker.on("click", () => onSelectProviderRef.current(provider.providerId));
        return marker;
      });

      if (shouldFitResults && providers.length > 1) {
        const bounds: LatLngBoundsExpression = providers.map((provider) => [
          provider.clinicLatitude,
          provider.clinicLongitude,
        ]);
        map.fitBounds(bounds, { maxZoom: 16, padding: [34, 34] });
      } else if (shouldFitResults && providers[0]) {
        map.setView([providers[0].clinicLatitude, providers[0].clinicLongitude], 16);
      }
    }

    syncMarkers();

    return () => {
      cancelled = true;
    };
  }, [isMapReady, providers, selectedProviderId]);

  return <div ref={containerRef} className="provider-results-map" aria-label="Provider tree results map" />;
}
