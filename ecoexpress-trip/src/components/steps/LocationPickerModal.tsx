'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Search, MapPin, Loader2 } from 'lucide-react';
import { reverseGeocode } from '@/lib/reverse-geocode';
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

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setSelectedCoords('');
            setResolvedName('');
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isOpen]);

    const performSearch = async () => {
        setIsSearching(true);
        try {
            const viewbox = '77.5,8.8,78.2,9.5';
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Kovilpatti Tamil Nadu')}&viewbox=${viewbox}&bounded=0&limit=5&countrycodes=in`
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

    const handleMapSelect = (lat: number, lng: number) => {
        const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setSelectedCoords(coordStr);
        setResolvedName('');
        setIsResolving(true);

        clearTimeout(resolveRef.current);
        resolveRef.current = setTimeout(async () => {
            const name = await reverseGeocode({ lat, lng });
            setResolvedName(name);
            setIsResolving(false);
        }, 300);
    };

    const handleConfirm = () => {
        onConfirm(selectedCoords);
    };

    if (!isOpen) return null;

    const displayText = resolvedName || selectedCoords || 'Tap the map to pin a location';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
                style={{ height: '92vh' }}>

                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{title || 'Select Location'}</h3>
                        <p className="text-xs text-green-600 font-medium">Search or tap on the map to pin</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-4 pt-3 pb-2 shrink-0 relative z-10">
                    <div className="relative shadow-sm rounded-xl border border-gray-200">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            {isSearching
                                ? <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                                : <Search className="w-4 h-4 text-gray-400" />
                            }
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search villages (e.g. Kalugumalai)..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none"
                        />
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="absolute left-4 right-4 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto divide-y divide-gray-50 z-[10000]">
                            {searchResults.map((result) => (
                                <button
                                    key={result.place_id}
                                    onClick={() => handleResultSelect(result)}
                                    className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-start gap-3 transition-colors"
                                >
                                    <div className="bg-gray-100 p-1.5 rounded-full shrink-0 mt-0.5">
                                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-semibold text-gray-800 block truncate">{result.display_name.split(',')[0]}</span>
                                        <span className="text-xs text-gray-500 block truncate">{result.display_name.split(',').slice(1, 3).join(',')}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Map — explicit height, not flex-1 */}
                <div className="relative mx-4 rounded-2xl overflow-hidden border border-gray-200 shadow-inner"
                    style={{ height: '55vh', minHeight: 300 }}>
                    <Map
                        onLocationSelect={handleMapSelect}
                        initialLat={mapCenter?.[0]}
                        initialLng={mapCenter?.[1]}
                    />

                    {/* Crosshair center hint */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[500]">
                        <div className="w-6 h-6 border-2 border-green-500 rounded-full bg-white/50" />
                    </div>

                    {/* Selected Location pill */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-5 py-2.5 rounded-full shadow-lg border border-gray-100 flex items-center gap-2 z-[1000] max-w-[90%] pointer-events-none">
                        {isResolving
                            ? <Loader2 className="w-3 h-3 text-green-500 animate-spin shrink-0" />
                            : <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                        }
                        <span className="text-xs font-bold text-gray-700 truncate">
                            {isResolving ? 'Resolving location…' : displayText}
                        </span>
                    </div>
                </div>

                {/* Confirm Button */}
                <div className="p-4 shrink-0 mt-auto">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedCoords}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-green-900/10 text-base"
                    >
                        <Check className="w-5 h-5" />
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
}
