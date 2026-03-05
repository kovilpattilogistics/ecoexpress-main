'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWizard } from '@/components/wizard/WizardManager';
import { MapPin, ChevronLeft, ChevronRight, Map, Globe, Navigation, Loader2, X } from 'lucide-react';
import { ZONE_A_TOWNS } from '@/lib/location-service';
import { getRoadDistance } from '@/lib/road-distance';
import { reverseGeocode, forwardGeocode } from '@/lib/reverse-geocode';
import { TRANSLATIONS } from '@/lib/translations';
import { clsx } from 'clsx';
import { LocationPickerModal } from './LocationPickerModal';
import RouteMap from '@/components/ui/RouteMap';

export function Step2Location() {
    const { data, updateData, goToNextStep, goToPreviousStep, lang, toggleLang } = useWizard();
    const t = TRANSLATIONS[lang];
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [distance, setDistance] = useState<number>(0);
    const [activeSearchField, setActiveSearchField] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);
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

    const stopsLatLngKey = JSON.stringify(data.stopsLatLng || []);
    useEffect(() => {
        computeTotalDistance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.pickupLatLng, data.dropLatLng, stopsLatLngKey, data.endLatLng, data.deliveryType]);

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
        const coordMatch = location.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
        const latLng = coordMatch ? { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) } : null;
        let displayName = location;
        if (latLng) displayName = await reverseGeocode(latLng);

        if (pickerField === 'pickup') updateData({ pickupLocation: displayName, ...(latLng ? { pickupLatLng: latLng } : {}) });
        else if (pickerField === 'drop') updateData({ dropLocation: displayName, ...(latLng ? { dropLatLng: latLng } : {}) });
        else if (pickerField === 'end') updateData({ endLocation: displayName, ...(latLng ? { endLatLng: latLng } : {}) });
        else if (pickerField?.startsWith('stop-')) {
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
            setSuggestions(ZONE_A_TOWNS.filter(town => town.toLowerCase().includes(value.toLowerCase())));
        } else {
            setSuggestions([]);
        }
    };

    const selectSuggestion = async (town: string) => {
        if (activeSearchField === 'drop') updateData({ dropLocation: town });
        else if (activeSearchField === 'end') updateData({ endLocation: town });
        else if (activeSearchField === 'pickup') updateData({ pickupLocation: town });
        setSuggestions([]);
        const field = activeSearchField;
        setActiveSearchField(null);
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

    const handleBlurGeocode = async (field: 'pickup' | 'drop' | 'end') => {
        const value = field === 'pickup' ? data.pickupLocation : field === 'drop' ? data.dropLocation : data.endLocation;
        const currentLatLng = field === 'pickup' ? data.pickupLatLng : field === 'drop' ? data.dropLatLng : data.endLatLng;
        if (value && value.length > 2 && !currentLatLng) {
            const latLng = await forwardGeocode(value);
            if (latLng) {
                if (field === 'pickup') updateData({ pickupLatLng: latLng });
                else if (field === 'drop') updateData({ dropLatLng: latLng });
                else if (field === 'end') updateData({ endLatLng: latLng });
            }
        }
    };

    const pickupValid = data.pickupLocation.length > 3;
    const dropValid = data.deliveryType === 'single' ? data.dropLocation.length > 3 : data.endLocation.length > 3;
    const isValid = pickupValid && dropValid;

    const handleContinue = () => {
        if (!isValid) { setShowErrors(true); return; }
        setShowErrors(false);
        goToNextStep();
    };

    // Shared location input renderer
    const LocationInput = ({
        value, onChange, onBlur, label, placeholder, field, isError, errorMsg, isPickup
    }: {
        value: string; onChange: (v: string) => void; onBlur: () => void;
        label: string; placeholder: string; field: 'pickup' | 'drop' | 'end';
        isError: boolean; errorMsg: string; isPickup: boolean;
    }) => (
        <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">{label}</label>
            <div className="relative flex items-center">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <MapPin className={clsx('w-4 h-4', isPickup ? 'text-green-600' : 'text-red-500')} />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setActiveSearchField(field)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    className={clsx(
                        'w-full pl-11 pr-24 py-4 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white',
                        isError ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50'
                            : 'border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-50'
                    )}
                />
                {/* GPS */}
                <button
                    onClick={() => handleGPS(field)}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title={t.useGpsBtn}
                >
                    {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                </button>
                {/* Map */}
                <button
                    onClick={() => openMapPicker(field)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    title={t.pickOnMap}
                >
                    <Map className="w-4 h-4" />
                </button>
            </div>
            {isError && <p className="text-xs text-red-500 font-medium mt-1.5 ml-1">{errorMsg}</p>}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white px-5 py-4 shadow-sm z-20 relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                <div className="flex items-center justify-between">
                    <button onClick={goToPreviousStep} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.stepOf} 2 {t.of} 4</p>
                        <h2 className="text-base font-black text-gray-800">
                            {data.deliveryType === 'single' ? t.step2Title : t.step2TitleMulti}
                        </h2>
                    </div>
                    <button onClick={toggleLang} className="flex flex-col items-center p-2 text-gray-500 hover:text-primary rounded-xl transition-colors">
                        <Globe className="w-4 h-4" />
                        <span className="text-[9px] font-bold mt-0.5">{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
                <div className="h-full w-2/4 bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

                {/* Pickup */}
                <div className="relative bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <LocationInput
                        value={data.pickupLocation}
                        onChange={(v) => handleSearch(v, 'pickup')}
                        onBlur={() => handleBlurGeocode('pickup')}
                        label={t.pickupLabel}
                        placeholder={t.pickupPlaceholder}
                        field="pickup"
                        isError={showErrors && !pickupValid}
                        errorMsg={t.pickupRequired}
                        isPickup={true}
                    />
                    {activeSearchField === 'pickup' && suggestions.length > 0 && (
                        <div className="absolute left-4 right-4 z-30 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto divide-y divide-gray-50">
                            {suggestions.map(town => (
                                <button key={town} onClick={() => selectSuggestion(town)}
                                    className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 text-sm text-gray-700">
                                    <MapPin className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                    {town}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Multiple Stops */}
                {data.deliveryType === 'multiple' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.stopsLabel} ({data.stops.length})</p>
                        {data.stops.map((stop, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">
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
                                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-50 outline-none text-sm font-medium bg-white transition-all"
                                    />
                                    <button
                                        onClick={() => openMapPicker(`stop-${index}`)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                                    >
                                        <Map className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        const newStops = data.stops.filter((_, i) => i !== index);
                                        updateData({ stops: newStops, stopsCount: newStops.length });
                                    }}
                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => {
                                const newStops = [...(data.stops || []), ''];
                                updateData({ stops: newStops, stopsCount: newStops.length });
                            }}
                            className="w-full py-3 border-2 border-dashed border-green-400 text-green-600 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors"
                        >
                            {t.addStop}
                        </button>
                    </div>
                )}

                {/* Drop Location */}
                <div className="relative bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <LocationInput
                        value={data.deliveryType === 'single' ? data.dropLocation : data.endLocation}
                        onChange={(v) => handleSearch(v, data.deliveryType === 'single' ? 'drop' : 'end')}
                        onBlur={() => handleBlurGeocode(data.deliveryType === 'single' ? 'drop' : 'end')}
                        label={data.deliveryType === 'single' ? t.dropLabel : t.dropLabelEnd}
                        placeholder={t.dropPlaceholder}
                        field={data.deliveryType === 'single' ? 'drop' : 'end'}
                        isError={showErrors && !dropValid}
                        errorMsg={t.dropRequired}
                        isPickup={false}
                    />
                    {activeSearchField && ['drop', 'end'].includes(activeSearchField) && suggestions.length > 0 && (
                        <div className="absolute left-4 right-4 z-30 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto divide-y divide-gray-50">
                            {suggestions.map(town => (
                                <button key={town} onClick={() => selectSuggestion(town)}
                                    className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 text-sm text-gray-700">
                                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                    {town}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Route Map Preview */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {routeWaypoints.length >= 2 ? (
                        <>
                            <div className="h-[180px] w-full">
                                <RouteMap waypoints={routeWaypoints} />
                            </div>
                            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                    <span className="text-xs font-medium text-gray-600 truncate">{data.pickupLocation.split(',')[0]}</span>
                                    <span className="text-gray-300 text-xs">→</span>
                                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                    <span className="text-xs font-medium text-gray-600 truncate">
                                        {(data.deliveryType === 'single' ? data.dropLocation : data.endLocation).split(',')[0] || '…'}
                                    </span>
                                </div>
                                <span className="text-sm font-black text-gray-900 shrink-0 ml-3 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg">{distance} km</span>
                            </div>
                        </>
                    ) : (
                        <div className="h-[120px] flex flex-col items-center justify-center gap-2">
                            <Map className="w-8 h-8 text-gray-300" />
                            <p className="text-xs text-gray-400 font-medium">{t.enterBothLocations}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-white border-t border-gray-100">
                <button
                    onClick={handleContinue}
                    className="w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-md shadow-green-200/50 active:scale-[0.97] transition-all"
                >
                    {t.continueBtn}
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

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
                title={pickerField === 'pickup' ? t.pickupLabel : t.dropLabel}
            />
        </div>
    );
}
