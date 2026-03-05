'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWizard } from '@/components/wizard/WizardManager';
import { MapPin, ChevronLeft, ChevronRight, Map, Globe, Navigation, Loader2 } from 'lucide-react';
import { ZONE_A_TOWNS } from '@/lib/location-service';
import { getRoadDistance } from '@/lib/road-distance';
import { reverseGeocode, forwardGeocode } from '@/lib/reverse-geocode';
import { TRANSLATIONS } from '@/lib/translations';
import { clsx } from 'clsx';
import { LocationPickerModal } from './LocationPickerModal';


import RouteMap from '@/components/ui/RouteMap';

export function Step2Location() {
    const { data, updateData, goToNextStep, goToPreviousStep, lang, toggleLang } = useWizard();
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [distance, setDistance] = useState<number>(0);
    const [activeSearchField, setActiveSearchField] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    // Map Picker State
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [pickerField, setPickerField] = useState<string | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);

    const openMapPicker = (field: string) => {
        setPickerField(field);
        setShowMapPicker(true);
    };

    const handleGPS = async (field: 'pickup' | 'drop' | 'end') => {
        if (!navigator.geolocation) return;
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                const name = await reverseGeocode(latLng);
                if (field === 'pickup') updateData({ pickupLocation: name, pickupLatLng: latLng });
                else if (field === 'drop') updateData({ dropLocation: name, dropLatLng: latLng });
                else if (field === 'end') updateData({ endLocation: name, endLatLng: latLng });
                setGpsLoading(false);
            },
            () => setGpsLoading(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Helper: compute total road distance from all waypoints
    const computeTotalDistance = async () => {
        type LL = { lat: number; lng: number };
        const waypoints: LL[] = [];
        if (data.pickupLatLng) waypoints.push(data.pickupLatLng);
        if (data.deliveryType === 'multiple') {
            for (const s of (data.stopsLatLng || [])) { if (s) waypoints.push(s); }
            if (data.endLatLng) waypoints.push(data.endLatLng);
        } else {
            if (data.dropLatLng) waypoints.push(data.dropLatLng);
        }
        if (waypoints.length >= 2) {
            const d = await getRoadDistance(waypoints);
            setDistance(d);
        }
    };

    // Auto-recalculate distance when any coordinates change
    // Serialize stopsLatLng to avoid reference-equality re-triggers
    const stopsLatLngKey = JSON.stringify(data.stopsLatLng || []);
    useEffect(() => {
        computeTotalDistance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.pickupLatLng, data.dropLatLng, stopsLatLngKey, data.endLatLng, data.deliveryType]);

    // Build waypoints for the route map preview
    const routeWaypoints = useMemo(() => {
        const wps: { lat: number; lng: number; label: string; type: 'pickup' | 'drop' | 'stop' }[] = [];
        if (data.pickupLatLng) {
            wps.push({ ...data.pickupLatLng, label: data.pickupLocation.split(',')[0] || 'Pickup', type: 'pickup' });
        }
        if (data.deliveryType === 'multiple') {
            for (let i = 0; i < (data.stopsLatLng || []).length; i++) {
                const sll = data.stopsLatLng[i];
                if (sll) wps.push({ ...sll, label: data.stops[i]?.split(',')[0] || `Stop ${String.fromCharCode(65 + i)}`, type: 'stop' });
            }
            if (data.endLatLng) wps.push({ ...data.endLatLng, label: data.endLocation.split(',')[0] || 'End', type: 'drop' });
        } else {
            if (data.dropLatLng) wps.push({ ...data.dropLatLng, label: data.dropLocation.split(',')[0] || 'Drop', type: 'drop' });
        }
        return wps;
    }, [data]);

    const handleLocationPicked = async (location: string) => {
        // Try to parse coordinates from the location string (format: "lat, lng" or "Name, Place")
        const coordMatch = location.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
        const latLng = coordMatch
            ? { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) }
            : null;

        // Reverse geocode to get area name if we have coordinates
        let displayName = location;
        if (latLng) {
            displayName = await reverseGeocode(latLng);
        }

        if (pickerField === 'pickup') {
            updateData({ pickupLocation: displayName, ...(latLng ? { pickupLatLng: latLng } : {}) });
        } else if (pickerField === 'drop') {
            updateData({ dropLocation: displayName, ...(latLng ? { dropLatLng: latLng } : {}) });
        } else if (pickerField === 'end') {
            updateData({ endLocation: displayName, ...(latLng ? { endLatLng: latLng } : {}) });
        } else if (pickerField?.startsWith('stop-')) {
            const index = parseInt(pickerField.split('-')[1]);
            const newStops = [...data.stops];
            newStops[index] = displayName;
            const newStopsLatLng = [...(data.stopsLatLng || [])];
            newStopsLatLng[index] = latLng;
            updateData({ stops: newStops, stopsLatLng: newStopsLatLng });
        }

        setShowMapPicker(false);
        setPickerField(null);
    };

    const handleSearch = (value: string, field: 'drop' | 'end' | 'stop' | 'pickup', stopIndex?: number) => {
        if (field === 'drop') updateData({ dropLocation: value, dropLatLng: null });
        else if (field === 'end') updateData({ endLocation: value, endLatLng: null });
        else if (field === 'pickup') updateData({ pickupLocation: value, pickupLatLng: null });

        setActiveSearchField(field === 'stop' && stopIndex !== undefined ? `stop-${stopIndex}` : field);

        if (value.length > 1) {
            const filtered = ZONE_A_TOWNS.filter(town =>
                town.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const selectSuggestion = async (town: string) => {
        if (activeSearchField === 'drop') {
            updateData({ dropLocation: town });
        } else if (activeSearchField === 'end') {
            updateData({ endLocation: town });
        } else if (activeSearchField === 'pickup') {
            updateData({ pickupLocation: town });
        }
        setSuggestions([]);
        const field = activeSearchField;
        setActiveSearchField(null);

        // Forward geocode to get lat/lng
        const latLng = await forwardGeocode(town);
        if (latLng && field) {
            if (field === 'pickup') updateData({ pickupLatLng: latLng });
            else if (field === 'drop') updateData({ dropLatLng: latLng });
            else if (field === 'end') updateData({ endLatLng: latLng });
            else if (field.startsWith('stop-')) {
                const idx = parseInt(field.split('-')[1]);
                const newStopsLatLng = [...(data.stopsLatLng || [])];
                newStopsLatLng[idx] = latLng;
                updateData({ stopsLatLng: newStopsLatLng });
            }
        }
    };

    // Geocode on blur when user types a location manually (no suggestion selected)
    const handleBlurGeocode = async (field: 'pickup' | 'drop' | 'end') => {
        const value = field === 'pickup' ? data.pickupLocation
            : field === 'drop' ? data.dropLocation
                : data.endLocation;
        const currentLatLng = field === 'pickup' ? data.pickupLatLng
            : field === 'drop' ? data.dropLatLng
                : data.endLatLng;

        // Only geocode if there's text and no existing lat/lng
        if (value && value.length > 2 && !currentLatLng) {
            const latLng = await forwardGeocode(value);
            if (latLng) {
                if (field === 'pickup') updateData({ pickupLatLng: latLng });
                else if (field === 'drop') updateData({ dropLatLng: latLng });
                else if (field === 'end') updateData({ endLatLng: latLng });
            }
        }
    };

    // Validations — both pickup and drop/end are required
    const pickupValid = data.pickupLocation.length > 3;
    const dropValid = data.deliveryType === 'single'
        ? data.dropLocation.length > 3
        : data.endLocation.length > 3;
    const isValid = pickupValid && dropValid;

    const handleContinue = () => {
        if (!isValid) {
            setShowErrors(true);
            return;
        }
        setShowErrors(false);
        goToNextStep();
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm z-20 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" />
                <div className="flex items-center justify-between mb-2">
                    <button onClick={goToPreviousStep} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 2 of 4</span>
                    <button onClick={toggleLang} className="flex flex-col items-center justify-center p-1 text-gray-500 hover:text-primary transition-colors border border-transparent rounded-lg">
                        <Globe className="w-5 h-5" />
                        <span className="text-[10px] leading-none mt-0.5">{lang === 'en' ? 'EN' : 'TA'}</span>
                    </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {data.deliveryType === 'single' ? 'Enter Locations' : 'Route Details'}
                </h2>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                {/* Pickup Location */}
                <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Pickup Location</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <input
                            type="text"
                            value={data.pickupLocation}
                            onChange={(e) => handleSearch(e.target.value, 'pickup')}
                            onFocus={() => setActiveSearchField('pickup')}
                            onBlur={() => handleBlurGeocode('pickup')}
                            placeholder="Enter pickup location..."
                            className={clsx(
                                "w-full pl-12 pr-24 py-4 rounded-xl border-2 outline-none transition-all font-medium text-lg",
                                showErrors && !pickupValid
                                    ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50"
                                    : "border-gray-200 focus:border-primary focus:ring-4 focus:ring-green-50"
                            )}
                        />
                        {showErrors && !pickupValid && (
                            <p className="text-xs text-red-500 font-medium mt-1.5 ml-1">* Pickup location is required</p>
                        )}
                        {/* GPS Button */}
                        <button
                            onClick={() => handleGPS('pickup')}
                            className="absolute right-14 top-1/2 -translate-y-1/2 p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors border border-green-200"
                            title="Use GPS"
                        >
                            {gpsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                        </button>
                        {/* Map Picker CTA */}
                        <button
                            onClick={() => openMapPicker('pickup')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-100 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors border border-gray-200"
                            title="Pick on Map"
                        >
                            <Map className="w-5 h-5" />
                        </button>
                    </div>
                    {/* Suggestions for pickup */}
                    {activeSearchField === 'pickup' && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-30 max-h-60 overflow-y-auto">
                            {suggestions.map((town) => (
                                <button
                                    key={town}
                                    onClick={() => selectSuggestion(town)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center gap-3"
                                >
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">{town}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Multiple Shops: Dynamic Stops List */}
                {data.deliveryType === 'multiple' && (
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                            intermediate Stops ({data.stops.length})
                        </label>

                        {data.stops.map((stop, index) => (
                            <div key={index} className="relative group animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <input
                                            type="text"
                                            value={stop}
                                            onChange={(e) => {
                                                const newStops = [...data.stops];
                                                newStops[index] = e.target.value;
                                                updateData({ stops: newStops, stopsCount: newStops.length });
                                                handleSearch(e.target.value, 'stop', index);
                                            }}
                                            placeholder={`Stop ${String.fromCharCode(65 + index)}`}
                                            className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-green-50 outline-none transition-all text-sm font-medium"
                                        />
                                        {/* Map Picker CTA */}
                                        <button
                                            onClick={() => openMapPicker(`stop-${index}`)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors border border-gray-200"
                                            title="Pick on Map"
                                        >
                                            <Map className="w-4 h-4" />
                                        </button>
                                        {/* Suggestions for this specific input */}
                                        {activeSearchField === `stop-${index}` && suggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-48 overflow-y-auto">
                                                {suggestions.map((town) => (
                                                    <button
                                                        key={town}
                                                        onClick={() => {
                                                            const newStops = [...data.stops];
                                                            newStops[index] = town;
                                                            updateData({ stops: newStops, stopsCount: newStops.length });
                                                            setSuggestions([]);
                                                            setActiveSearchField(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 block"
                                                    >
                                                        {town}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newStops = data.stops.filter((_, i) => i !== index);
                                            updateData({ stops: newStops, stopsCount: newStops.length });
                                        }}
                                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <div className="w-5 h-5 flex items-center justify-center font-bold">×</div>
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => {
                                const newStops = [...(data.stops || []), ''];
                                updateData({ stops: newStops, stopsCount: newStops.length });
                            }}
                            className="w-full py-3 border-2 border-dashed border-primary text-primary rounded-xl font-bold text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>+ Add Stop</span>
                        </button>
                    </div>
                )}


                {/* Drop Location */}
                <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                        {data.deliveryType === 'single' ? 'Drop Location' : 'End Point (Last Shop)'}
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <MapPin className="w-5 h-5 text-red-500" />
                        </div>
                        <input
                            type="text"
                            value={data.deliveryType === 'single' ? data.dropLocation : data.endLocation}
                            onChange={(e) => handleSearch(e.target.value, data.deliveryType === 'single' ? 'drop' : 'end')}
                            onFocus={() => setActiveSearchField(data.deliveryType === 'single' ? 'drop' : 'end')}
                            onBlur={() => handleBlurGeocode(data.deliveryType === 'single' ? 'drop' : 'end')}
                            placeholder="Search area or village..."
                            className={clsx(
                                "w-full pl-12 pr-14 py-4 rounded-xl border-2 outline-none transition-all font-medium text-lg",
                                showErrors && !dropValid
                                    ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50"
                                    : "border-gray-200 focus:border-primary focus:ring-4 focus:ring-green-50"
                            )}
                        />
                        {showErrors && !dropValid && (
                            <p className="text-xs text-red-500 font-medium mt-1.5 ml-1">* {data.deliveryType === 'single' ? 'Drop' : 'End point'} location is required</p>
                        )}
                        {/* GPS Button */}
                        <button
                            onClick={() => handleGPS(data.deliveryType === 'single' ? 'drop' : 'end')}
                            className="absolute right-14 top-1/2 -translate-y-1/2 p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors border border-green-200"
                            title="Use GPS"
                        >
                            {gpsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                        </button>
                        {/* Map Picker CTA */}
                        <button
                            onClick={() => openMapPicker(data.deliveryType === 'single' ? 'drop' : 'end')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-100 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors border border-gray-200"
                            title="Pick on Map"
                        >
                            <Map className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Suggestions */}
                    {activeSearchField && ['drop', 'end'].includes(activeSearchField) && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-30 max-h-60 overflow-y-auto">
                            {suggestions.map((town) => (
                                <button
                                    key={town}
                                    onClick={() => selectSuggestion(town)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center gap-3"
                                >
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">{town}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Live Route Map */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative z-0" style={{ isolation: 'isolate' }}>
                    {routeWaypoints.length >= 2 ? (
                        <>
                            <div className="h-[180px] w-full">
                                <RouteMap waypoints={routeWaypoints} />
                            </div>
                            <div className="p-3 flex items-center justify-between text-sm border-t border-gray-100">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-green-600 shrink-0" />
                                    <span className="text-gray-600 font-medium truncate text-xs">{data.pickupLocation.split(',')[0]}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                                    <span className="text-gray-600 font-medium truncate text-xs">{(data.deliveryType === 'single' ? data.dropLocation : data.endLocation).split(',')[0] || '...'}</span>
                                </div>
                                <span className="font-bold text-gray-900 shrink-0 ml-2">{distance} km</span>
                            </div>
                        </>
                    ) : (
                        <div className="h-[120px] flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                                    <Map className="w-7 h-7 text-gray-300" />
                                </div>
                                <p className="text-xs text-gray-400 font-medium">Enter pickup & drop to preview route</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-white border-t border-gray-100">
                <button
                    onClick={handleContinue}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-bold transition-all shadow-md shadow-green-200/50 bg-gradient-to-r from-primary to-emerald-600 text-white hover:from-[#1b5e20] hover:to-emerald-700 transform active:scale-95"
                >
                    CONTINUE
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            {/* Map Picker Modal */}
            <LocationPickerModal
                isOpen={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onConfirm={handleLocationPicked}
                initialLocation={
                    pickerField === 'pickup' ? data.pickupLocation :
                        pickerField === 'drop' ? data.dropLocation :
                            pickerField === 'end' ? data.endLocation :
                                pickerField?.startsWith('stop-') ? data.stops[parseInt(pickerField.split('-')[1])] : ''
                }
            />

        </div>
    );
}
