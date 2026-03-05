'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon broken in Vite/Webpack builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const DEFAULT_CENTER: [number, number] = [9.1725, 77.8812];

interface MapProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

export default function NativeMap({ onLocationSelect, initialLat, initialLng }: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markerInstance = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize map only once
        if (!mapInstance.current) {
            const center = initialLat && initialLng ? [initialLat, initialLng] as [number, number] : DEFAULT_CENTER;

            mapInstance.current = L.map(mapRef.current).setView(center, 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(mapInstance.current);

            // Add initial marker
            markerInstance.current = L.marker(center, { icon: customIcon }).addTo(mapInstance.current);

            // Handle map clicks
            mapInstance.current.on('click', (e: L.LeafletMouseEvent) => {
                const { lat, lng } = e.latlng;

                // Move marker
                if (markerInstance.current) {
                    markerInstance.current.setLatLng([lat, lng]);
                }

                // Notify parent
                onLocationSelect(lat, lng);
            });

            // Fix Leaflet rendering inside modals
            setTimeout(() => {
                mapInstance.current?.invalidateSize();
            }, 100);
        }

        // Cleanup on unmount
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount and unmount

    // Handle updates from external initialLat/Lng (e.g. from search)
    useEffect(() => {
        if (mapInstance.current && markerInstance.current && initialLat && initialLng) {
            const newPos: [number, number] = [initialLat, initialLng];
            markerInstance.current.setLatLng(newPos);
            mapInstance.current.setView(newPos, 14);
        }
    }, [initialLat, initialLng]);

    return (
        <div
            ref={mapRef}
            style={{ width: '100%', height: '100%', zIndex: 1 }}
            className="leaflet-native-map-container"
        />
    );
}
