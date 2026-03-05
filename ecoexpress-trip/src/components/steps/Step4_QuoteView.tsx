'use client';

import React, { useState, useMemo } from 'react';
import { QuoteResult, PriceBreakdown } from '@/lib/pricing-engine';
import { MessageCircle, Phone, RotateCcw, ChevronDown, ChevronUp, ChevronLeft, Globe, MapPin, Clock, Package } from 'lucide-react';
import { useWizard } from '@/components/wizard/WizardManager';
import { clsx } from 'clsx';
import { TRANSLATIONS } from '@/lib/translations';
import RouteMap from '@/components/ui/RouteMap';

interface Props {
    quote: QuoteResult;
    serviceType: 'scheduled' | 'dedicated' | 'express';
}

const SERVICE_META = {
    dedicated: { emoji: '🚛', label: 'Dedicated Vehicle', labelTa: 'அர்ப்பணிப்பு வாகனம்', border: 'border-orange-400', bg: 'bg-orange-50', pill: 'bg-orange-100 text-orange-700', priceBg: 'from-orange-500 to-amber-500' },
    scheduled: { emoji: '📅', label: 'Scheduled Route', labelTa: 'திட்டமிடப்பட்ட பாதை', border: 'border-blue-400', bg: 'bg-blue-50', pill: 'bg-blue-100 text-blue-700', priceBg: 'from-blue-500 to-cyan-500' },
    express: { emoji: '⚡', label: 'Express (Priority)', labelTa: 'விரைவு (முன்னுரிமை)', border: 'border-purple-400', bg: 'bg-purple-50', pill: 'bg-purple-100 text-purple-700', priceBg: 'from-purple-500 to-violet-500' },
};

function BreakdownRow({ label, value }: { label: string; value: number }) {
    if (value === 0) return null;
    return (
        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100 last:border-0">
            <span className="text-sm text-gray-600">{label}</span>
            <span className="text-sm font-bold text-gray-800">₹ {value.toLocaleString('en-IN')}</span>
        </div>
    );
}

export function Step4QuoteView({ quote, serviceType }: Props) {
    const { data, resetWizard, goToPreviousStep, lang, toggleLang } = useWizard();
    const t = TRANSLATIONS[lang];
    const svcMeta = SERVICE_META[serviceType];
    const [showBreakdown, setShowBreakdown] = useState(false);

    const selectedBreakdown: PriceBreakdown = quote[serviceType];

    const routeWaypoints = useMemo(() => {
        const wps: { lat: number; lng: number; label: string; type: 'pickup' | 'drop' | 'stop' }[] = [];
        if (data.pickupLatLng) wps.push({ ...data.pickupLatLng, label: data.pickupLocation.split(',')[0], type: 'pickup' });
        if (data.deliveryType === 'multiple') {
            (data.stopsLatLng || []).forEach((sll, i) => {
                if (sll) wps.push({ ...sll, label: data.stops[i]?.split(',')[0] || `Stop ${i + 1}`, type: 'stop' });
            });
            if (data.endLatLng) wps.push({ ...data.endLatLng, label: data.endLocation.split(',')[0] || 'End', type: 'drop' });
        } else {
            if (data.dropLatLng) wps.push({ ...data.dropLatLng, label: data.dropLocation.split(',')[0] || 'Drop', type: 'drop' });
        }
        return wps;
    }, [data]);

    const buildWhatsApp = () => {
        const bd = selectedBreakdown;
        const svcName = lang === 'en' ? svcMeta.label : svcMeta.labelTa;
        const dropLine = data.deliveryType === 'single'
            ? `📍 *${t.drop}:* ${data.dropLocation}`
            : `📍 *${t.drop}:* ${data.endLocation}`;

        const stopsLines = (data.stops || []).map((s, i) => s ? `   Stop ${String.fromCharCode(65 + i)}: ${s}` : '').filter(Boolean).join('\n');
        const distNote = data.deliveryType === 'single' && serviceType === 'dedicated'
            ? `${quote.distance} km × 2 = ${quote.distance * 2} km round trip`
            : `${quote.distance} km`;

        let breakdown = '';
        if (bd.base > 0) breakdown += `  ${t.baseCharge}: ₹${bd.base}\n`;
        if (bd.distanceCharge > 0) breakdown += `  ${t.distanceCharge}: ₹${bd.distanceCharge}\n`;
        if (bd.stopsCharge > 0) breakdown += `  ${t.stopsCharge}: ₹${bd.stopsCharge}\n`;
        if (bd.weightCharge > 0) breakdown += `  ${t.weightCharge}: ₹${bd.weightCharge}\n`;
        if (bd.waitingCharge > 0) breakdown += `  ${t.waitingCharge}: ₹${bd.waitingCharge}\n`;

        const msg = `🚚 *Book Trip — EcoExpress Logistics*

📍 *${t.pickup}:* ${data.pickupLocation}
${dropLine}
${stopsLines ? `   ${t.stopsLabel}:\n${stopsLines}\n` : ''}
📏 *${t.distance}:* ${distNote}
⚖️ *${t.weight}:* ${data.weight} kg
🕐 *${t.waiting}:* ${data.expectedWaitingHours} ${t.hours}

💰 *${t.fareBreakdown}:*
  ${t.selectedService}: ${svcName}
${breakdown}  *${t.total}: ₹${bd.total.toLocaleString('en-IN')}*

✅ ${lang === 'en' ? 'Please confirm my booking. Thank you!' : 'என் முன்பதிவை உறுதிப்படுத்தவும். நன்றி!'}`;

        window.open(`https://wa.me/916381065877?text=${encodeURIComponent(msg)}`);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white px-5 py-4 shadow-sm z-10 relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                <div className="flex items-center justify-between">
                    <button onClick={goToPreviousStep} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.stepOf} 4 {t.of} 4</p>
                        <h2 className="text-base font-black text-gray-800">{t.quoteReady}</h2>
                    </div>
                    <button onClick={toggleLang} className="flex flex-col items-center p-2 text-gray-500 hover:text-primary rounded-xl transition-colors">
                        <Globe className="w-4 h-4" />
                        <span className="text-[9px] font-bold mt-0.5">{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
                    </button>
                </div>
            </div>

            {/* Full progress */}
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-400" />

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-32">

                {/* Route Map */}
                {routeWaypoints.length >= 2 && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="h-[160px] w-full">
                            <RouteMap waypoints={routeWaypoints} />
                        </div>
                        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                                <span className="text-xs font-medium text-gray-600 truncate">{data.pickupLocation.split(',')[0]}</span>
                                <span className="text-gray-300">→</span>
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                                <span className="text-xs font-medium text-gray-600 truncate">
                                    {(data.deliveryType === 'single' ? data.dropLocation : data.endLocation).split(',')[0] || '…'}
                                </span>
                            </div>
                            <span className="text-xs font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-lg shrink-0 ml-2">{quote.distance} km</span>
                        </div>
                    </div>
                )}

                {/* Price Card */}
                <div className={clsx('bg-white rounded-2xl border-2 shadow-md overflow-hidden', svcMeta.border)}>
                    {/* Price header */}
                    <div className={clsx('px-5 py-5 bg-gradient-to-r text-white', svcMeta.priceBg)}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{svcMeta.emoji}</span>
                            <span className="font-bold text-sm opacity-90">{lang === 'en' ? svcMeta.label : svcMeta.labelTa}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-base opacity-80">₹</span>
                            <span className="text-5xl font-black">{selectedBreakdown.total.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-xs opacity-75 mt-1 font-medium">{selectedBreakdown.note}</p>
                    </div>

                    {/* Breakdown toggle */}
                    <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full flex items-center justify-between px-5 py-3 border-b border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        {showBreakdown ? t.hideBreakdown : t.viewBreakdown}
                        {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showBreakdown && (
                        <div className="px-5 py-4">
                            <BreakdownRow label={t.baseCharge} value={selectedBreakdown.base} />
                            <BreakdownRow label={t.distanceCharge} value={selectedBreakdown.distanceCharge} />
                            <BreakdownRow label={t.stopsCharge} value={selectedBreakdown.stopsCharge} />
                            <BreakdownRow label={t.weightCharge} value={selectedBreakdown.weightCharge} />
                            <BreakdownRow label={t.waitingCharge} value={selectedBreakdown.waitingCharge} />
                            <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200">
                                <span className="font-black text-gray-800">{t.total}</span>
                                <span className="font-black text-lg text-gray-900">₹ {selectedBreakdown.total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Trip Summary */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t.tripDetails}</p>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                <MapPin className="w-3 h-3 text-green-600" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{t.pickup}</p>
                                <p className="text-sm text-gray-700 font-medium">{data.pickupLocation}</p>
                            </div>
                        </div>
                        {(data.stops || []).filter(Boolean).map((stop, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[10px] font-black text-orange-600">{String.fromCharCode(65 + i)}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Stop {String.fromCharCode(65 + i)}</p>
                                    <p className="text-sm text-gray-700 font-medium">{stop}</p>
                                </div>
                            </div>
                        ))}
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                <MapPin className="w-3 h-3 text-red-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{t.drop}</p>
                                <p className="text-sm text-gray-700 font-medium">
                                    {data.deliveryType === 'single' ? data.dropLocation : data.endLocation}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                            <div className="text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">{t.distance}</p>
                                <p className="text-sm font-black text-gray-800">{quote.distance} km</p>
                            </div>
                            <div className="text-center border-x border-gray-100">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">{t.weight}</p>
                                <p className="text-sm font-black text-gray-800">{data.weight} kg</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">{t.waiting}</p>
                                <p className="text-sm font-black text-gray-800">{data.expectedWaitingHours}h</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-sm border-t border-gray-100 space-y-3">
                <button
                    onClick={buildWhatsApp}
                    className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-200/50 active:scale-[0.97] transition-all"
                >
                    <MessageCircle className="w-5 h-5" />
                    {t.bookWhatsApp}
                </button>
                <div className="flex gap-3">
                    <a
                        href="tel:+916381065877"
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                        <Phone className="w-4 h-4" />
                        {t.callUs}
                    </a>
                    <button
                        onClick={resetWizard}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        {t.restart}
                    </button>
                </div>
            </div>
        </div>
    );
}
