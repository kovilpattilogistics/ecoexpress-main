'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default marker icon missing in Leaflet + Next.js/Webpack
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Kovilpatti Coordinates
const DEFAULT_CENTER: [number, number] = [9.1725, 77.8812];

interface MapProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

// Component to handle map clicks
function MapEvents({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Component to fly to new center if props change
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function Map({ onLocationSelect, initialLat, initialLng }: MapProps) {
    const [markerPos, setMarkerPos] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : DEFAULT_CENTER
    );

    // Sync with props when search updates them
    useEffect(() => {
        if (initialLat && initialLng) {
            setMarkerPos([initialLat, initialLng]);
        }
    }, [initialLat, initialLng]);

    const handleSelect = (lat: number, lng: number) => {
        setMarkerPos([lat, lng]);
        onLocationSelect(lat, lng);
    };

    return (
        <MapContainer
            center={markerPos || DEFAULT_CENTER}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {markerPos && <Marker position={markerPos} icon={customIcon} />}

            <MapEvents onSelect={handleSelect} />
            {markerPos && <MapUpdater center={markerPos} />}
        </MapContainer>
    );
}
