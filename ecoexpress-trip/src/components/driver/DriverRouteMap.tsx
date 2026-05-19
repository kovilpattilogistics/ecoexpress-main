'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface DriverMapWaypoint {
    lat: number;
    lng: number;
    label: string;
    type: 'pickup' | 'stop' | 'drop';
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const makeIcon = (bg: string, inner: string, size: number) =>
    new L.DivIcon({
        className: '',
        html: `<div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${bg};border:3px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
            display:flex;align-items:center;justify-content:center;
            font-size:${size === 32 ? 11 : 9}px;font-weight:900;color:#fff;
        ">${inner}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });

const PICKUP_ICON = makeIcon('#16a34a', '▶', 32);
const DROP_ICON   = makeIcon('#dc2626', '■', 32);
const STOP_ICON   = makeIcon('#f97316', '●', 26);

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
    waypoints: DriverMapWaypoint[];
    height?: number;
}

export default function DriverRouteMap({ waypoints, height = 220 }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.FeatureGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [routeError, setRouteError] = useState(false);

    // ── Init map once ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            zoomControl: true,
            scrollWheelZoom: false,   // prevent scroll-jacking in page
            doubleClickZoom: true,
            touchZoom: true,
            attributionControl: true,
        }).setView([9.1714, 77.8614], 13); // center on Kovilpatti

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        layersRef.current = L.featureGroup().addTo(map);
        mapRef.current = map;

        // Multiple invalidateSize attempts to handle scrollable-container timing
        [100, 300, 600, 1000].forEach(delay =>
            setTimeout(() => map.invalidateSize(), delay)
        );

        const handlePrint = () => {
            map.invalidateSize();
        };
        window.addEventListener('beforeprint', handlePrint);
        const mql = window.matchMedia('print');
        mql.addEventListener('change', handlePrint);

        return () => {
            window.removeEventListener('beforeprint', handlePrint);
            mql.removeEventListener('change', handlePrint);
            map.remove();
            mapRef.current = null;
            layersRef.current = null;
        };
    }, []);

    // ── Draw route whenever waypoints change ──────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        const layers = layersRef.current;
        if (!map || !layers || waypoints.length < 2) return;

        layers.clearLayers();
        setLoading(true);
        setRouteError(false);

        // 1. Add markers immediately so the map is useful even before route loads
        const allLatLngs: L.LatLng[] = [];
        waypoints.forEach(wp => {
            const ll = L.latLng(wp.lat, wp.lng);
            allLatLngs.push(ll);
            const icon = wp.type === 'pickup' ? PICKUP_ICON : wp.type === 'drop' ? DROP_ICON : STOP_ICON;
            L.marker(ll, { icon })
                .bindPopup(`<b style="font-size:11px">${wp.label}</b>`)
                .addTo(layers);
        });

        // Fit map to markers straight away
        if (allLatLngs.length >= 2) {
            map.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40], maxZoom: 15 });
        }

        // 2. Fetch OSRM road route and draw the red line
        const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

        let cancelled = false;
        fetch(url)
            .then(r => r.json())
            .then(data => {
                if (cancelled) return;
                if (data.routes?.[0]?.geometry?.coordinates) {
                    const latLngs: [number, number][] = data.routes[0].geometry.coordinates.map(
                        (c: [number, number]) => [c[1], c[0]]
                    );
                    // Draw the route BELOW the markers (insertAtBottom)
                    L.polyline(latLngs, {
                        color: '#dc2626',
                        weight: 5,
                        opacity: 0.9,
                        lineJoin: 'round',
                        lineCap: 'round',
                    }).addTo(layers);

                    // Re-fit to include route geometry
                    map.fitBounds(L.latLngBounds(latLngs), { padding: [45, 45], maxZoom: 15 });
                } else {
                    // Draw straight-line fallback
                    L.polyline(allLatLngs, { color: '#dc2626', weight: 4, dashArray: '8 6' }).addTo(layers);
                    setRouteError(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    L.polyline(allLatLngs, { color: '#dc2626', weight: 4, dashArray: '8 6' }).addTo(layers);
                    setRouteError(true);
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [waypoints]);

    if (waypoints.length < 2) return null;

    return (
        <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
            {/* Leaflet container — explicit pixel height, never % */}
            <div
                ref={containerRef}
                style={{ width: '100%', height: '100%', borderRadius: '0 0 16px 16px', zIndex: 0 }}
            />

            {/* Loading overlay */}
            {loading && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.75)', zIndex: 10,
                    borderRadius: '0 0 16px 16px',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 28, height: 28, border: '3px solid #e5e7eb',
                            borderTopColor: '#16a34a', borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite', margin: '0 auto 6px',
                        }} />
                        <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>Loading route…</p>
                    </div>
                </div>
            )}

            {/* Route fallback notice */}
            {routeError && !loading && (
                <div style={{
                    position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10,
                    padding: '3px 10px', borderRadius: 20, zIndex: 10, whiteSpace: 'nowrap',
                }}>
                    Straight-line shown (road route unavailable)
                </div>
            )}

            {/* CSS for spinner */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
