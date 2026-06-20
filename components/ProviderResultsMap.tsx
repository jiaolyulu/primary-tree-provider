"use client";

import type { DivIcon, LatLngBoundsExpression, LatLngExpression, Map as LeafletMap, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { ProviderMatch } from "@/lib/providers";

export function ProviderResultsMap({
  providers,
  selectedProviderId,
  focusProviderId,
  focusRequestId = 0,
  onSelectProvider,
}: {
  providers: ProviderMatch[];
  selectedProviderId: number;
  focusProviderId?: number | null;
  focusRequestId?: number;
  onSelectProvider: (providerId: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const markersByProviderIdRef = useRef(new Map<number, Marker>());
  const onSelectProviderRef = useRef(onSelectProvider);
  const providersRef = useRef(providers);
  const providerIdsRef = useRef("");
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    onSelectProviderRef.current = onSelectProvider;
  }, [onSelectProvider]);

  useEffect(() => {
    providersRef.current = providers;
  }, [providers]);

  useEffect(() => {
    let cancelled = false;
    let cleanupWheelZoom: (() => void) | null = null;
    const markersByProviderId = markersByProviderIdRef.current;

    async function initMap() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      const mapContainer = containerRef.current;

      const firstProvider = providers[0];
      const initialPosition: LatLngExpression = firstProvider
        ? [firstProvider.clinicLatitude, firstProvider.clinicLongitude]
        : [40.7128, -74.006];
      const map = L.map(mapContainer, {
        attributionControl: false,
        maxZoom: 18,
        minZoom: 10,
        scrollWheelZoom: false,
        zoomDelta: 0.5,
        zoomSnap: 0.5,
        zoomControl: true,
      }).setView(initialPosition, 14);
      L.DomEvent.disableScrollPropagation(mapContainer);

      let lastWheelZoomAt = 0;
      const onWheelZoom = (event: WheelEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const now = performance.now();
        if (now - lastWheelZoomAt < 70) return;
        lastWheelZoomAt = now;

        const direction = event.deltaY < 0 ? 1 : -1;
        const currentZoom = map.getZoom();
        const nextZoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), currentZoom + direction * 0.5));
        if (nextZoom === currentZoom) return;

        const point = map.mouseEventToContainerPoint(event as unknown as MouseEvent);
        map.setZoomAround(point, nextZoom);
      };
      mapContainer.addEventListener("wheel", onWheelZoom, { passive: false });
      cleanupWheelZoom = () => mapContainer.removeEventListener("wheel", onWheelZoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setIsMapReady(true);
    }

    initMap();

    return () => {
      cancelled = true;
      cleanupWheelZoom?.();
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
      markersByProviderId.clear();
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
      markersByProviderIdRef.current.clear();
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
        markersByProviderIdRef.current.set(provider.providerId, marker);
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || focusProviderId == null) return;

    const provider = providersRef.current.find((entry) => entry.providerId === focusProviderId);
    if (!provider) return;

    const position: LatLngExpression = [provider.clinicLatitude, provider.clinicLongitude];
    const targetZoom = Math.max(map.getZoom(), 17);
    map.flyTo(position, targetZoom, { animate: true, duration: 0.75 });
    const tooltipTimer = window.setTimeout(() => {
      markersByProviderIdRef.current.get(provider.providerId)?.openTooltip();
    }, 120);
    return () => window.clearTimeout(tooltipTimer);
  }, [focusProviderId, focusRequestId, isMapReady]);

  return <div ref={containerRef} className="provider-results-map" aria-label="Provider tree results map" />;
}
