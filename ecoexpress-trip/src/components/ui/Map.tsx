'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

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

// Kovilpatti Coordinates
const DEFAULT_CENTER: [number, number] = [9.1725, 77.8812];

interface MapProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function Map({ onLocationSelect, initialLat, initialLng }: MapProps) {
    const center: [number, number] = (initialLat && initialLng)
        ? [initialLat, initialLng]
        : DEFAULT_CENTER;

    const [markerPos, setMarkerPos] = useState<[number, number]>(center);

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
            center={markerPos}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={markerPos} icon={customIcon} />
            <MapClickHandler onSelect={handleSelect} />
            <MapUpdater center={markerPos} />
        </MapContainer>
    );
}
