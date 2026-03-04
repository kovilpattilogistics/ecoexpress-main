'use client';

import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Custom icons
const pickupIcon = new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#16a34a;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24"  ="none" stroke="white" stroke-width="3"><circle cx="12" cy="12" r="4"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const dropIcon = new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#dc2626;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24"  ="none" stroke="white" stroke-width="3"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const stopIcon = new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="width:26px;height:26px;border-radius:50%;background:#f97316;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="10" height="10" viewBox="0 0 24 24"  ="white"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

// Auto-fit bounds to show all markers and route
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }, [bounds, map]);
    return null;
}

interface RouteMapProps {
    waypoints: { lat: number; lng: number; label: string; type: 'pickup' | 'drop' | 'stop' }[];
}

export default function RouteMap({ waypoints }: RouteMapProps) {
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

    useEffect(() => {
        if (waypoints.length < 2) return;

        const fetchRoute = async () => {
            try {
                // Build OSRM coordinates string
                const coords = waypoints
                    .map(wp => `${wp.lng},${wp.lat}`)
                    .join(';');

                const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.routes?.[0]?.geometry?.coordinates) {
                    // OSRM returns [lng, lat] — convert to [lat, lng] for Leaflet
                    const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
                        (c: [number, number]) => [c[1], c[0]]
                    );
                    setRouteCoords(coords);
                }
            } catch (err) {
                console.warn('Route fetch failed:', err);
                // Fallback: straight lines between waypoints
                setRouteCoords(waypoints.map(wp => [wp.lat, wp.lng]));
            }
        };

        fetchRoute();
    }, [waypoints]);

    if (waypoints.length < 2) return null;

    // Compute bounds from all waypoints + route
    const allPoints = [
        ...waypoints.map(wp => L.latLng(wp.lat, wp.lng)),
        ...routeCoords.map(c => L.latLng(c[0], c[1])),
    ];
    const bounds = allPoints.length > 0
        ? L.latLngBounds(allPoints)
        : L.latLngBounds([[9.17, 77.88], [9.17, 77.88]]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'pickup': return pickupIcon;
            case 'drop': return dropIcon;
            default: return stopIcon;
        }
    };

    return (
        <MapContainer
            center={[waypoints[0].lat, waypoints[0].lng]}
            zoom={12}
            style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 0 }}
            scrollWheelZoom={true}
            dragging={true}
            zoomControl={true}
            doubleClickZoom={true}
            touchZoom={true}
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Route line in red */}
            {routeCoords.length > 0 && (
                <Polyline
                    positions={routeCoords}
                    pathOptions={{
                        color: '#dc2626',
                        weight: 4,
                        opacity: 0.85,
                        dashArray: undefined,
                    }}
                />
            )}

            {/* Markers */}
            {waypoints.map((wp, i) => (
                <Marker key={i} position={[wp.lat, wp.lng]} icon={getIcon(wp.type)}>
                    <Popup>
                        <div className="text-xs font-bold">{wp.label}</div>
                    </Popup>
                </Marker>
            ))}

            <FitBounds bounds={bounds} />
        </MapContainer>
    );
}
