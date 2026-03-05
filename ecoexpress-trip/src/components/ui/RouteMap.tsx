'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons
const createIcon = (color: string, svgPath: string, size: number) => new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="${size === 32 ? 14 : 10}" height="${size === 32 ? 14 : 10}" viewBox="0 0 24 24" fill="${size === 32 ? 'none' : 'white'}" stroke="${size === 32 ? 'white' : 'none'}" stroke-width="3">${svgPath}</svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
});

const pickupIcon = createIcon('#16a34a', '<circle cx="12" cy="12" r="4"/>', 32);
const dropIcon = createIcon('#dc2626', '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/>', 32);
const stopIcon = createIcon('#f97316', '<rect x="6" y="6" width="12" height="12" rx="2"/>', 26);

interface RouteMapProps {
    waypoints: { lat: number; lng: number; label: string; type: 'pickup' | 'drop' | 'stop' }[];
}

export default function RouteMap({ waypoints }: RouteMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const layerGroup = useRef<L.FeatureGroup | null>(null);

    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

    // Fetch route from OSRM
    useEffect(() => {
        if (waypoints.length < 2) return;

        let cancelled = false;

        const fetchRoute = async () => {
            try {
                // Build OSRM coordinates string
                const coords = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
                const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();

                if (cancelled) return;

                if (data.routes?.[0]?.geometry?.coordinates) {
                    // OSRM returns [lng, lat] => needs [lat, lng]
                    const c: [number, number][] = data.routes[0].geometry.coordinates.map(
                        (coord: [number, number]) => [coord[1], coord[0]]
                    );
                    setRouteCoords(c);
                } else {
                    setRouteCoords(waypoints.map(wp => [wp.lat, wp.lng]));
                }
            } catch (err) {
                console.warn('Route fetch failed:', err);
                if (!cancelled) {
                    setRouteCoords(waypoints.map(wp => [wp.lat, wp.lng]));
                }
            }
        };

        fetchRoute();

        return () => { cancelled = true; };
    }, [waypoints]);

    // Initialize Map and Update Layers
    useEffect(() => {
        if (!mapRef.current) return;

        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true,
                attributionControl: false
            }).setView([9.17, 77.88], 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

            layerGroup.current = L.featureGroup().addTo(mapInstance.current);

            setTimeout(() => {
                mapInstance.current?.invalidateSize();
            }, 100);
        }

        const map = mapInstance.current;
        const group = layerGroup.current;
        if (!map || !group) return;

        group.clearLayers();

        if (waypoints.length < 2) return;

        const allLatLngs: L.LatLng[] = [];

        // Draw Route Line
        if (routeCoords.length > 0) {
            const polyline = L.polyline(routeCoords, {
                color: '#dc2626',
                weight: 4,
                opacity: 0.85
            }).addTo(group);

            routeCoords.forEach(c => allLatLngs.push(L.latLng(c[0], c[1])));
        }

        // Draw Markers
        waypoints.forEach(wp => {
            const ll = L.latLng(wp.lat, wp.lng);
            allLatLngs.push(ll);

            let icon = stopIcon;
            if (wp.type === 'pickup') icon = pickupIcon;
            if (wp.type === 'drop') icon = dropIcon;

            const marker = L.marker(ll, { icon }).addTo(group);
            marker.bindPopup(`<div style="font-size: 11px; font-weight: bold;">${wp.label}</div>`);
        });

        // Fit Bounds
        if (allLatLngs.length > 0) {
            map.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40], maxZoom: 14 });
        }

    }, [waypoints, routeCoords]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                layerGroup.current = null;
            }
        };
    }, []);

    if (waypoints.length < 2) return null;

    return (
        <div
            ref={mapRef}
            style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 0 }}
            className="leaflet-native-route-map"
        />
    );
}
