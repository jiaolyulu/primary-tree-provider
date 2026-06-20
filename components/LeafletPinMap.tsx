"use client";

import type { LatLngExpression, Map as LeafletMap, Marker } from "leaflet";
import { useEffect, useRef } from "react";

type Pin = {
  latitude: number;
  longitude: number;
};

const nycBounds = {
  west: -74.065,
  south: 40.575,
  east: -73.78,
  north: 40.86,
};

function clampPin(pin: Pin) {
  return {
    latitude: Math.min(nycBounds.north, Math.max(nycBounds.south, pin.latitude)),
    longitude: Math.min(nycBounds.east, Math.max(nycBounds.west, pin.longitude)),
  };
}

export function LeafletPinMap({
  pin,
  onChange,
  showMarker = true,
}: {
  pin: Pin;
  onChange: (pin: Pin) => void;
  showMarker?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const initialPinRef = useRef(pin);
  const initialShowMarkerRef = useRef(showMarker);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const initialPosition: LatLngExpression = [initialPinRef.current.latitude, initialPinRef.current.longitude];
      const map = L.map(containerRef.current, {
        attributionControl: false,
        maxBounds: [
          [nycBounds.south, nycBounds.west],
          [nycBounds.north, nycBounds.east],
        ],
        maxBoundsViscosity: 0.8,
        maxZoom: 18,
        minZoom: 10,
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView(initialPosition, 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(initialPosition, {
        icon: L.divIcon({
          className: "pct-leaflet-marker",
          html: "<span></span>",
          iconAnchor: [17, 17],
          iconSize: [34, 34],
        }),
        opacity: initialShowMarkerRef.current ? 1 : 0,
      }).addTo(map);

      map.on("click", (event) => {
        onChangeRef.current(clampPin({ latitude: event.latlng.lat, longitude: event.latlng.lng }));
      });

      mapRef.current = map;
      markerRef.current = marker;
    }

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const position: LatLngExpression = [pin.latitude, pin.longitude];
    markerRef.current?.setLatLng(position);
  }, [pin.latitude, pin.longitude]);

  useEffect(() => {
    markerRef.current?.setOpacity(showMarker ? 1 : 0);
  }, [showMarker]);

  return <div ref={containerRef} className="leaflet-pin-map" aria-label="NYC map pin picker" />;
}
