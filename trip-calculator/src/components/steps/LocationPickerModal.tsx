'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Search, MapPin, Loader2 } from 'lucide-react';

import { reverseGeocode } from '@/lib/reverse-geocode';

// Dynamically import Map to avoid SSR issues
import Map from '@/components/ui/Map';

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location: string) => void;
    initialLocation: string;
    title?: string;
}

interface SearchResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
}

export function LocationPickerModal({ isOpen, onClose, onConfirm, initialLocation, title }: LocationPickerModalProps) {
    const [selectedCoords, setSelectedCoords] = useState('');
    const [resolvedName, setResolvedName] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
    const resolveRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length > 2) {
                performSearch();
            } else {
                setSearchResults([]);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const performSearch = async () => {
        setIsSearching(true);
        try {
            const viewbox = '77.7,9.0,78.0,9.3';
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=${viewbox}&bounded=1&limit=5`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleResultSelect = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        setMapCenter([lat, lon]);

        const simpleName = result.display_name.split(',').slice(0, 2).join(', ');
        setSelectedCoords(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        setResolvedName(simpleName);
        setSearchQuery(simpleName);
        setSearchResults([]);
    };

    if (!isOpen) return null;

    const handleMapSelect = (lat: number, lng: number) => {
        const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setSelectedCoords(coordStr);
        setResolvedName('');
        setIsResolving(true);

        // Debounce reverse geocode
        clearTimeout(resolveRef.current);
        resolveRef.current = setTimeout(async () => {
            const name = await reverseGeocode({ lat, lng });
            setResolvedName(name);
            setIsResolving(false);
        }, 300);
    };

    const handleConfirm = () => {
        // Send coords string — the parent will reverse geocode for the wizard data
        onConfirm(selectedCoords);
    };

    const displayText = resolvedName || selectedCoords || 'Tap map or search to select';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">

                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between bg-white z-10 shrink-0">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{title || 'Select Location'}</h3>
                        <p className="text-xs text-green-600 font-medium">Search or drag map to pin</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative bg-gray-50 z-0 overflow-hidden">

                    {/* Floating Search Bar */}
                    <div className="absolute top-4 left-4 right-4 z-[1000]">
                        <div className="relative shadow-lg rounded-xl">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                                {isSearching ? (
                                    <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4 text-gray-500" />
                                )}
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search villages (e.g., Kalugumalai)..."
                                className="w-full pl-12 pr-4 py-3.5 bg-white border-0 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:ring-0 outline-none"
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto divide-y divide-gray-50 overflow-hidden">
                                {searchResults.map((result) => (
                                    <button
                                        key={result.place_id}
                                        onClick={() => handleResultSelect(result)}
                                        className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-start gap-3 transition-colors bg-white"
                                    >
                                        <div className="bg-gray-100 p-1.5 rounded-full shrink-0">
                                            <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-semibold text-gray-800 block truncate">{result.display_name.split(',')[0]}</span>
                                            <span className="text-xs text-gray-500 block truncate">{result.display_name.split(',').slice(1).join(',')}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Map
                        onLocationSelect={handleMapSelect}
                        initialLat={mapCenter?.[0]}
                        initialLng={mapCenter?.[1]}
                    />

                    {/* Floating Location Display */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-5 py-2.5 rounded-full shadow-lg border border-gray-100 flex items-center gap-2 z-[1000] max-w-[90%] pointer-events-none">
                        {isResolving ? (
                            <Loader2 className="w-3 h-3 text-green-500 animate-spin shrink-0" />
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                        )}
                        <span className="text-xs font-bold text-gray-700 truncate">
                            {isResolving ? 'Resolving location...' : displayText}
                        </span>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-white border-t shrink-0 z-10">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedCoords}
                        className="w-full py-3.5 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-[#1b5e20] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-green-900/10"
                    >
                        <Check className="w-5 h-5" />
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
}
