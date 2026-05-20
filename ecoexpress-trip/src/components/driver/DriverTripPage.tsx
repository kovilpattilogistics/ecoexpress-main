'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Play, MapPin, Plus, Square, Send, RotateCcw,
    Navigation, Clock, Route, AlertCircle, CheckCircle2, Loader2, ChevronLeft, Printer,
} from 'lucide-react';
import {
    calculateDriverFare,
    formatDuration,
    type StopRecord,
    type DriverFareBreakdown,
} from '@/lib/driver-pricing-engine';
import { getRoadDistance } from '@/lib/road-distance';
import DriverRouteMap from '@/components/driver/DriverRouteMap';
import logoSrc from '@/assets/logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'start' | 'active' | 'result';

interface PersistedTrip {
    phase: Phase;
    startTime: string;        // ISO string
    startLat: number;
    startLng: number;
    stops: StopRecord[];
    endTime?: string;
    endLat?: number;
    endLng?: number;
    roadDistanceKm?: number;  // OSRM road distance, stored after end trip
}

const STORAGE_KEY = 'eco_driver_trip';
const ADMIN_PHONE = '916381065877';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function saveTrip(data: PersistedTrip) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadTrip(): PersistedTrip | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function clearTrip() {
    localStorage.removeItem(STORAGE_KEY);
}

function getLocation(): Promise<GeolocationPosition> {
    return new Promise((res, rej) => {
        if (!navigator.geolocation) { rej(new Error('Geolocation not supported')); return; }
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
}

function fmt(date: Date) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtCoord(v: number) { return v.toFixed(5); }

// ─── Live Timer ───────────────────────────────────────────────────────────────
function LiveTimer({ startTime }: { startTime: Date }) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        // Set immediately so no flicker on resume
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [startTime]);

    return (
        <div className="text-center py-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Trip Duration</p>
            <p className="text-5xl font-black text-gray-800 font-mono tracking-tight">
                {formatDuration(elapsed)}
            </p>
            <p className="text-xs text-gray-400 mt-2">Started at {fmt(startTime)}</p>
        </div>
    );
}

// ─── Phase: Start ─────────────────────────────────────────────────────────────
function PhaseStart({ onStart }: { onStart: () => Promise<void> }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handle = async () => {
        setLoading(true); setError(null);
        try { await onStart(); }
        catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not get location. Please allow GPS access.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-10 gap-6 bg-white">
            <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center">
                <Navigation className="w-9 h-9 text-green-600" />
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-black text-gray-800">Ready to Start?</h2>
                <p className="text-sm text-gray-500 mt-1">Make sure you are at the customer's location before starting.</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 w-full text-center">
                <p className="text-sm text-green-700 font-medium">📍 GPS will be captured automatically when you tap Start.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 w-full">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <button
                onClick={handle}
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black text-xl rounded-2xl shadow-lg shadow-green-200/50 flex items-center justify-center gap-3 active:scale-[0.97] transition-all disabled:opacity-60"
            >
                {loading
                    ? <><Loader2 className="w-6 h-6 animate-spin" /> Getting Location…</>
                    : <><Play className="w-6 h-6 fill-white" /> Start New Trip</>
                }
            </button>
        </div>
    );
}

// ─── Phase: Active ────────────────────────────────────────────────────────────
interface PhaseActiveProps {
    startTime: Date;
    startLat: number;
    startLng: number;
    stops: StopRecord[];
    onAddStop: () => Promise<void>;
    onEndTrip: () => Promise<void>;
    addingStop: boolean;
    endingTrip: boolean;
    error: string | null;
}

function PhaseActive({ startTime, startLat, startLng, stops, onAddStop, onEndTrip, addingStop, endingTrip, error }: PhaseActiveProps) {
    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Status pill */}
            <div className="px-5 pt-4 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <span className="text-green-600 text-xs font-black uppercase tracking-widest">Trip Active</span>
                </div>
            </div>

            {/* Timer card */}
            <div className="px-5 pt-3 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <LiveTimer startTime={startTime} />
                    <div className="px-4 pb-3 flex justify-between text-xs text-gray-400 border-t border-gray-100 pt-2">
                        <span>Pickup GPS captured ✓</span>
                        <span>{fmtCoord(startLat)}, {fmtCoord(startLng)}</span>
                    </div>
                </div>
            </div>

            {/* Stops list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {/* Start marker */}
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                    <div>
                        <p className="text-[10px] text-green-600 font-black uppercase tracking-wider">Trip Start</p>
                        <p className="text-sm text-gray-800 font-semibold">{fmt(startTime)}</p>
                    </div>
                </div>

                {stops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0 text-xs font-black text-white">
                            {i + 1}
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-orange-600 font-black uppercase tracking-wider">{stop.label}</p>
                            <p className="text-sm text-gray-800 font-semibold">{fmt(new Date(stop.timestamp))}</p>
                            <p className="text-[10px] text-gray-400">{fmtCoord(stop.lat)}, {fmtCoord(stop.lng)}</p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-orange-400" />
                    </div>
                ))}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-6 pt-3 space-y-3 shrink-0 bg-white border-t border-gray-100">
                <button
                    onClick={onAddStop}
                    disabled={addingStop || endingTrip}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-base rounded-2xl shadow-lg shadow-orange-200/50 flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-60"
                >
                    {addingStop
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Capturing Stop…</>
                        : <><Plus className="w-5 h-5" /> Add Stop {stops.length + 1}</>
                    }
                </button>

                <button
                    onClick={onEndTrip}
                    disabled={addingStop || endingTrip}
                    className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white font-black text-base rounded-2xl shadow-lg shadow-red-200/50 flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-60"
                >
                    {endingTrip
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Ending Trip…</>
                        : <><Square className="w-5 h-5 fill-white" /> End Trip</>
                    }
                </button>
            </div>
        </div>
    );
}

// ─── Phase: Result ────────────────────────────────────────────────────────────
interface PhaseResultProps {
    persisted: PersistedTrip;
    fare: DriverFareBreakdown;
    onStartNew: () => void;
}

function PhaseResult({ persisted, fare, onStartNew }: PhaseResultProps) {
    const startTime = new Date(persisted.startTime);
    const endTime = persisted.endTime ? new Date(persisted.endTime) : new Date();
    const totalSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Build waypoints for the RouteMap (same format as the existing RouteMap component)
    const mapWaypoints = [
        { lat: persisted.startLat, lng: persisted.startLng, label: 'Trip Start', type: 'pickup' as const },
        ...persisted.stops.map((s, i) => ({
            lat: s.lat, lng: s.lng, label: s.label, type: 'stop' as const,
        })),
        { lat: persisted.endLat!, lng: persisted.endLng!, label: 'Trip End', type: 'drop' as const },
    ];

    const sendToAccounts = () => {
        const stopLines = persisted.stops.map((s, i) =>
            `  Stop ${i + 1}: ${fmt(new Date(s.timestamp))} — (${fmtCoord(s.lat)}, ${fmtCoord(s.lng)})`
        ).join('\n');

        const msg = `🚚 *EcoExpress — Trip Report*

🕐 *Start:* ${fmt(startTime)}
📍 *Start GPS:* ${fmtCoord(persisted.startLat)}, ${fmtCoord(persisted.startLng)}
${persisted.stops.length > 0 ? `\n🔴 *Stops:*\n${stopLines}\n` : ''}
🏁 *End:* ${fmt(endTime)}
📍 *End GPS:* ${fmtCoord(persisted.endLat!)}, ${fmtCoord(persisted.endLng!)}

⏱ *Duration:* ${formatDuration(totalSeconds)}
📏 *Distance:* ${fare.distanceKm} km
🔢 *Delivery Stops:* ${fare.numberOfStops}

💰 *Fare Breakdown:*
  Type: ${fare.category}
  Base: ₹${fare.basePrice}${fare.extraStopsCharge > 0 ? `\n  Extra Stops: ₹${fare.extraStopsCharge}` : ''}${fare.extraTimeCharge > 0 ? `\n  Extra Time: ₹${fare.extraTimeCharge}` : ''}

  *Total: ₹${fare.total}*

📝 ${fare.note}`;

        window.location.assign(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`);
    };

    const [customerName, setCustomerName] = useState('');

    return (
        <div className="flex flex-col h-full bg-gray-50 print:bg-white print:h-auto">
            {/* Success header */}
            <div className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 px-5 pt-6 pb-8 shrink-0 text-center print:hidden">
                <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-black text-white">Trip Completed!</h2>
                <p className="text-white/70 text-xs mt-1">Here's your fare summary</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 -mt-4 print:!mt-0 print:overflow-visible print:!p-10 print:block print:bg-white print:border print:border-gray-300 print:m-8 print:rounded-2xl">
                
                {/* ── PRINT ONLY INVOICE HEADER ── */}
                <div className="hidden print:block mb-8">
                    <div className="flex items-center justify-between border-b-4 border-green-600 pb-4 mb-4 mt-4">
                        <div className="flex items-center gap-4">
                            <img src={logoSrc} alt="EcoExpress Logistics" className="w-16 h-16 object-contain" />
                            <div>
                                <h1 className="text-2xl font-black text-green-800 tracking-tight">EcoExpress Logistics</h1>
                                <p className="text-sm text-gray-600 font-medium italic">Clean Water. Fast Delivery. Eco Future.</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-black text-green-700 uppercase tracking-widest m-0">TRIP INVOICE</h2>
                            <p className="text-sm font-bold text-gray-600 mt-1">Date: {new Date().toLocaleDateString('en-IN')}</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2 border-b border-gray-200 inline-block pb-1">Company Details</h3>
                            <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                36/A, Valluvar Nagar,<br/>
                                Kadalaiyur Road, Kovilpatti – 628 501<br/>
                                Tamil Nadu, India<br/>
                                📞 +91 63810 65877
                            </p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2 border-b border-gray-200 inline-block pb-1">Customer / Trip Details</h3>
                            {customerName && <p className="text-lg font-black text-gray-800 mb-1">{customerName}</p>}
                            <p className="text-sm font-bold text-gray-700">{fare.category}</p>
                            <p className="text-sm text-gray-600 font-medium">{fare.distanceKm} km • {formatDuration(totalSeconds)}</p>
                        </div>
                    </div>
                </div>
                {/* Big price card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden print:border-2 print:border-gray-200 print:shadow-none print:rounded-xl">
                    <div className="px-5 py-5 text-center border-b border-gray-100 print:bg-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{fare.category}</p>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-gray-500 text-xl font-bold">₹</span>
                            <span className="text-gray-900 text-6xl font-black">{fare.total.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-2">{fare.note}</p>
                    </div>

                    {/* Breakdown */}
                    <div className="px-5 py-4 space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fare Breakdown</p>
                        <div className="flex justify-between py-1.5 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Base Price</span>
                            <span className="text-sm font-bold text-gray-800">₹ {fare.basePrice}</span>
                        </div>
                        {fare.extraStopsCharge > 0 && (
                            <div className="flex justify-between py-1.5 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Extra Stops</span>
                                <span className="text-sm font-bold text-gray-800">₹ {fare.extraStopsCharge}</span>
                            </div>
                        )}
                        {fare.extraTimeCharge > 0 && (
                            <div className="flex justify-between py-1.5 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Extra Time</span>
                                <span className="text-sm font-bold text-gray-800">₹ {fare.extraTimeCharge}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-200">
                            <span className="font-black text-gray-800">Total</span>
                            <span className="font-black text-xl text-green-600">₹ {fare.total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Route Map */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:border-2 print:border-gray-200 print:shadow-none print:mt-8 print:rounded-xl">
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between print:hidden">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Route Verification</p>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {fare.distanceKm} km road distance
                        </span>
                    </div>
                    <div className="print:h-[400px]">
                        <DriverRouteMap waypoints={mapWaypoints} height={220} />
                    </div>
                    <div className="px-4 py-2 flex gap-4 text-[10px] text-gray-400 border-t border-gray-100 print:hidden">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Start</span>
                        {persisted.stops.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Stops</span>}
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> End</span>
                    </div>
                    <div className="hidden print:flex px-6 py-4 bg-gray-50 items-center justify-between border-t border-gray-200">
                        <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">Route Verification Map</span>
                        <span className="text-sm font-black text-green-700">{fare.distanceKm} Total Km</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 print:hidden">
                    {[
                        { icon: <Clock className="w-4 h-4 text-green-500" />, label: 'Duration', value: formatDuration(totalSeconds) },
                        { icon: <Route className="w-4 h-4 text-orange-500" />, label: 'Distance', value: `${fare.distanceKm} km` },
                        { icon: <MapPin className="w-4 h-4 text-red-500" />, label: 'Stops', value: String(fare.numberOfStops) },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3 text-center">
                            <div className="flex justify-center mb-1">{s.icon}</div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{s.label}</p>
                            <p className="text-sm font-black text-gray-800 mt-0.5">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 print:hidden">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Trip Timeline</p>
                    <div className="space-y-3">
                        <TLEntry color="bg-green-500" label="Start" time={fmt(startTime)} coord={`${fmtCoord(persisted.startLat)}, ${fmtCoord(persisted.startLng)}`} />
                        {persisted.stops.map((s, i) => (
                            <TLEntry key={i} color="bg-orange-400" label={s.label} time={fmt(new Date(s.timestamp))} coord={`${fmtCoord(s.lat)}, ${fmtCoord(s.lng)}`} />
                        ))}
                        <TLEntry color="bg-red-500" label="End" time={fmt(endTime)} coord={`${fmtCoord(persisted.endLat!)}, ${fmtCoord(persisted.endLng!)}`} />
                    </div>
                </div>
            </div>

            {/* Footer actions */}
            <div className="px-5 pb-6 pt-3 space-y-3 shrink-0 bg-white border-t border-gray-100 print:hidden">
                <div className="flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder="Customer Name (Optional for Print)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={sendToAccounts}
                            className="flex-[2] py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-black text-base rounded-2xl shadow-lg shadow-green-200/50 flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                        >
                            <Send className="w-5 h-5" />
                            Send to Accounts
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-700 font-black text-base rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                        >
                            <Printer className="w-5 h-5" />
                            Print
                        </button>
                    </div>
                </div>
                <button
                    onClick={onStartNew}
                    className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-base rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                >
                    <RotateCcw className="w-5 h-5" />
                    Start New Trip
                </button>
            </div>
        </div>
    );
}

function TLEntry({ color, label, time, coord }: { color: string; label: string; time: string; coord: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${color} mt-1.5 shrink-0`} />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-800">{label}</span>
                    <span className="text-xs text-gray-400 font-mono">{time}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{coord}</p>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DriverTripPage({ onExit }: { onExit: () => void }) {
    const [persisted, setPersisted] = useState<PersistedTrip | null>(null);
    const [fare, setFare] = useState<DriverFareBreakdown | null>(null);
    const [addingStop, setAddingStop] = useState(false);
    const [endingTrip, setEndingTrip] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Restore from localStorage on mount
    useEffect(() => {
        const saved = loadTrip();
        if (saved) {
            setPersisted(saved);
            // If trip already completed, restore fare from saved road distance
            if (saved.phase === 'result' && saved.endLat != null) {
                const dist = saved.roadDistanceKm ?? 0;
                const dur = Math.ceil((new Date(saved.endTime!).getTime() - new Date(saved.startTime).getTime()) / 60000);
                setFare(calculateDriverFare(dist, dur, saved.stops.length + 1));
            }
        }
    }, []);

    const phase: Phase = persisted?.phase ?? 'start';

    const handleStart = useCallback(async () => {
        const pos = await getLocation();
        const now = new Date();
        const data: PersistedTrip = {
            phase: 'active',
            startTime: now.toISOString(),
            startLat: pos.coords.latitude,
            startLng: pos.coords.longitude,
            stops: [],
        };
        saveTrip(data);
        setPersisted(data);

        // WhatsApp notification
        const msg = `🚀 *EcoExpress Trip Started*\n\n🕐 Time: ${fmt(now)}\n📍 GPS: ${fmtCoord(pos.coords.latitude)}, ${fmtCoord(pos.coords.longitude)}\n\nDriver has started a new trip.`;
        window.location.assign(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`);
    }, []);

    const handleAddStop = useCallback(async () => {
        if (!persisted) return;
        setAddingStop(true); setActionError(null);
        try {
            const pos = await getLocation();
            const stop: StopRecord = {
                index: persisted.stops.length + 1,
                timestamp: new Date(),
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                label: `Stop ${persisted.stops.length + 1}`,
            };
            const updated: PersistedTrip = { ...persisted, stops: [...persisted.stops, stop] };
            saveTrip(updated);
            setPersisted(updated);
        } catch (e: unknown) {
            setActionError(e instanceof Error ? e.message : 'Could not get GPS. Try again.');
        } finally { setAddingStop(false); }
    }, [persisted]);

    const handleEndTrip = useCallback(async () => {
        if (!persisted) return;
        setEndingTrip(true); setActionError(null);
        try {
            const pos = await getLocation();
            const endTime = new Date();

            // Build waypoints for OSRM road distance
            const waypoints = [
                { lat: persisted.startLat, lng: persisted.startLng },
                ...persisted.stops.map(s => ({ lat: s.lat, lng: s.lng })),
                { lat: pos.coords.latitude, lng: pos.coords.longitude },
            ];

            // Fetch real road distance from OSRM (falls back to haversine if offline)
            const roadDist = await getRoadDistance(waypoints);

            const updated: PersistedTrip = {
                ...persisted,
                phase: 'result',
                endTime: endTime.toISOString(),
                endLat: pos.coords.latitude,
                endLng: pos.coords.longitude,
                roadDistanceKm: roadDist,
            };
            saveTrip(updated);
            setPersisted(updated);

            const dur = Math.ceil((endTime.getTime() - new Date(persisted.startTime).getTime()) / 60000);
            const calculatedFare = calculateDriverFare(roadDist, dur, persisted.stops.length + 1);
            setFare(calculatedFare);

            // WhatsApp notification for End Trip
            const msg = `🏁 *EcoExpress Trip Ended*\n\n🕐 Time: ${fmt(endTime)}\n📍 GPS: ${fmtCoord(pos.coords.latitude)}, ${fmtCoord(pos.coords.longitude)}\n📏 Distance: ${roadDist} km\n⏱ Duration: ${formatDuration(dur * 60)}\n\nDriver has ended the trip.`;
            window.location.assign(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`);

        } catch (e: unknown) {
            setActionError(e instanceof Error ? e.message : 'Could not get GPS. Try again.');
        } finally { setEndingTrip(false); }
    }, [persisted]);

    const handleStartNew = useCallback(() => {
        clearTrip();
        setPersisted(null);
        setFare(null);
        setActionError(null);
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Header — matches website style */}
            <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 px-5 pt-5 pb-5 shrink-0 print:hidden">
                <div className="flex items-center justify-between">
                    <button
                        onClick={onExit}
                        className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-bold transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="flex items-center gap-3">
                        <img src={logoSrc} alt="EcoExpress" className="w-8 h-8 object-contain rounded-lg bg-white p-0.5" />
                        <div>
                            <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest">EcoExpress</p>
                            <p className="text-white font-black text-sm leading-tight">Driver Mode</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                        <span className="text-emerald-200 text-[10px] font-bold uppercase">
                            {phase === 'start' ? 'Ready' : phase === 'active' ? 'Active' : 'Done'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Phase content */}
            <div className="flex-1 overflow-hidden">
                {phase === 'start' && <PhaseStart onStart={handleStart} />}

                {phase === 'active' && persisted && (
                    <PhaseActive
                        startTime={new Date(persisted.startTime)}
                        startLat={persisted.startLat}
                        startLng={persisted.startLng}
                        stops={persisted.stops}
                        onAddStop={handleAddStop}
                        onEndTrip={handleEndTrip}
                        addingStop={addingStop}
                        endingTrip={endingTrip}
                        error={actionError}
                    />
                )}

                {phase === 'result' && persisted && fare && (
                    <PhaseResult persisted={persisted} fare={fare} onStartNew={handleStartNew} />
                )}
            </div>
        </div>
    );
}
