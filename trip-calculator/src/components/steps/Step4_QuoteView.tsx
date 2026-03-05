'use client';

import React, { useState, useMemo } from 'react';
import { QuoteResult, PriceBreakdown } from '@/lib/pricing-engine';
import { MessageCircle, Phone, RotateCcw, ChevronDown, ChevronUp, ChevronLeft, Check, Calendar, Truck, Zap, MapPin, Package, Route, Clock, Weight, Globe } from 'lucide-react';
import { useWizard } from '@/components/wizard/WizardManager';
import { clsx } from 'clsx';
import { TRANSLATIONS } from '@/lib/translations';


// Dynamically import RouteMap to avoid SSR issues with Leaflet
import RouteMap from '@/components/ui/RouteMap';

interface TripInfo {
    pickup: string;
    drop: string;
    stops: string[];
    distance: number;
    weight: number;
    waitingHours: number;
    deliveryType: string;
}

interface Props {
    quote: QuoteResult;
    serviceType: 'scheduled' | 'dedicated' | 'express';
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
    if (value === 0) return null;
    return (
        <div className="flex justify-between">
            <span>{label}</span>
            <span>₹ {value}</span>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
    return (
        <div className="flex items-start gap-2.5">
            <div className={clsx("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5", color)}>
                <Icon className="w-3 h-3 text-white" />
            </div>
            <div className="min-w-0">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">{label}</span>
                <p className="text-xs text-gray-700 font-medium truncate">{value}</p>
            </div>
        </div>
    );
}

function PricingCard({
    tier,
    isSelected,
    isRecommended,
    icon: Icon,
    iconColor,
    borderColor,
    bgColor,
    tripInfo,
}: {
    tier: PriceBreakdown;
    isSelected: boolean;
    isRecommended: boolean;
    icon: React.ElementType;
    iconColor: string;
    borderColor: string;
    bgColor: string;
    tripInfo: TripInfo;
}) {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className={clsx(
            "bg-white rounded-xl p-5 relative overflow-hidden transition-all",
            isSelected ? `border-2 ${borderColor} shadow-md` : "border border-gray-200 opacity-80"
        )}>
            {isRecommended && (
                <div className={clsx("absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg", bgColor)}>
                    SELECTED
                </div>
            )}

            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center", isSelected ? bgColor + ' text-white' : 'bg-gray-100 text-gray-400')}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className={clsx("font-bold", isSelected ? "text-gray-900" : "text-gray-600")}>{tier.model}</h3>
                        <p className="text-xs text-gray-400 max-w-[200px] truncate">{tier.note.split('. ')[0]}</p>
                    </div>
                </div>
            </div>

            <div className={clsx("text-2xl font-black mt-2", isSelected ? iconColor : "text-gray-500")}>
                ₹ {tier.total}
            </div>

            <button
                onClick={() => setShowDetails(!showDetails)}
                className={clsx(
                    "mt-3 text-xs font-bold flex items-center gap-1 transition-colors",
                    showDetails ? "text-gray-600" : "text-[var(--primary)] hover:text-green-700"
                )}
            >
                {showDetails ? 'Hide details' : '📋 View breakdown'}
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showDetails && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-4">
                    {/* Trip Details */}
                    <div className="space-y-2.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trip Details</p>
                        <InfoRow icon={MapPin} label="Pickup" value={tripInfo.pickup} color="bg-green-600" />
                        {tripInfo.stops.length > 0 && tripInfo.stops.map((stop, i) => (
                            <InfoRow key={i} icon={Package} label={`Stop ${String.fromCharCode(65 + i)}`} value={stop} color="bg-orange-500" />
                        ))}
                        <InfoRow icon={MapPin} label="Drop" value={tripInfo.drop} color="bg-red-500" />
                        <div className="grid grid-cols-3 gap-2 pt-1">
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                                <Route className="w-3.5 h-3.5 mx-auto text-gray-400 mb-0.5" />
                                <p className="text-xs font-bold text-gray-800">{tripInfo.distance} km</p>
                                <p className="text-[9px] text-gray-400">Distance</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                                <Weight className="w-3.5 h-3.5 mx-auto text-gray-400 mb-0.5" />
                                <p className="text-xs font-bold text-gray-800">{tripInfo.weight} kg</p>
                                <p className="text-[9px] text-gray-400">Weight</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                                <Clock className="w-3.5 h-3.5 mx-auto text-gray-400 mb-0.5" />
                                <p className="text-xs font-bold text-gray-800">{tripInfo.waitingHours} hr</p>
                                <p className="text-[9px] text-gray-400">Waiting</p>
                            </div>
                        </div>
                    </div>

                    {/* Fare Breakdown */}
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fare Breakdown</p>
                        <div className="text-xs text-gray-600 space-y-1.5 bg-gray-50 rounded-lg p-3">
                            <BreakdownRow label="Base Charge" value={tier.base} />
                            <BreakdownRow label="Stops Charge" value={tier.stopsCharge} />
                            <BreakdownRow label="Weight Charge" value={tier.weightCharge} />
                            <BreakdownRow label="Distance Charge" value={tier.distanceCharge} />
                            <BreakdownRow label="Waiting Charge" value={tier.waitingCharge} />
                            <div className="flex justify-between font-bold pt-2 border-t border-gray-200 text-gray-900 text-sm">
                                <span>Total</span>
                                <span>₹ {tier.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Service Note */}
                    <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                        <p className="text-[10px] text-blue-700 leading-relaxed">
                            ℹ️ {tier.note}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export function Step4QuoteView({ quote, serviceType }: Props) {
    const { resetWizard, goToPreviousStep, data, lang, toggleLang } = useWizard();
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

    const selectedTier = quote[serviceType];

    // Build waypoints for the route map
    const waypoints = useMemo(() => {
        const wps: { lat: number; lng: number; label: string; type: 'pickup' | 'drop' | 'stop' }[] = [];

        if (data.pickupLatLng) {
            wps.push({ ...data.pickupLatLng, label: data.pickupLocation.split(',')[0] || 'Pickup', type: 'pickup' });
        }

        if (data.deliveryType === 'multiple') {
            // Add intermediate stops
            for (let i = 0; i < (data.stopsLatLng || []).length; i++) {
                const sll = data.stopsLatLng[i];
                if (sll) {
                    wps.push({ ...sll, label: data.stops[i]?.split(',')[0] || `Stop ${String.fromCharCode(65 + i)}`, type: 'stop' });
                }
            }
            // Add end location
            if (data.endLatLng) {
                wps.push({ ...data.endLatLng, label: data.endLocation.split(',')[0] || 'End', type: 'drop' });
            }
        } else {
            if (data.dropLatLng) {
                wps.push({ ...data.dropLatLng, label: data.dropLocation.split(',')[0] || 'Drop', type: 'drop' });
            }
        }

        return wps;
    }, [data]);

    const handleWhatsApp = () => {
        const dest = data.deliveryType === 'single' ? data.dropLocation : data.endLocation;
        const stops = data.deliveryType === 'multiple' && data.stops?.length > 0
            ? data.stops.map((s: string, i: number) => `  Stop ${String.fromCharCode(65 + i)}: ${s}`).join('%0A')
            : null;

        const lines = [
            `🚚 *Book Trip — Welcome to EcoExpress Logistics!*`,
            ``,
            `📍 *Pickup:* ${data.pickupLocation}`,
            ...(stops ? [`📦 *Stops:*%0A${stops}`] : []),
            `📍 *Drop:* ${dest}`,
            ``,
            `📏 *Distance:* ${quote.distance} km${data.deliveryType === 'single' ? ` (${quote.distance} km × 2 = ${quote.distance * 2} km round trip)` : ' (total route)'}`,
            `⚖️ *Weight:* ${quote.weight} kg`,
            `🕐 *Waiting:* ${data.expectedWaitingHours || 0} hour(s)`,
            ``,
            `💰 *Fare Breakdown:*`,
            `  Service: ${selectedTier.model}`,
            ...(selectedTier.base > 0 ? [`  Base Charge: ₹${selectedTier.base}`] : []),
            ...(selectedTier.distanceCharge > 0 ? [`  Distance: ₹${selectedTier.distanceCharge}`] : []),
            ...(selectedTier.stopsCharge > 0 ? [`  Stops: ₹${selectedTier.stopsCharge}`] : []),
            ...(selectedTier.weightCharge > 0 ? [`  Weight: ₹${selectedTier.weightCharge}`] : []),
            ...(selectedTier.waitingCharge > 0 ? [`  Waiting: ₹${selectedTier.waitingCharge}`] : []),
            `  *Total: ₹${selectedTier.total}*`,
            ``,
            `✅ Please confirm my booking. Thank you!`,
        ];

        const text = lines.join('%0A');
        window.open(`https://wa.me/916381065877?text=${text}`, '_blank');
    };

    const dest = data.deliveryType === 'single' ? data.dropLocation : data.endLocation;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-[var(--primary)] via-emerald-600 to-green-700 px-6 py-6 text-white shadow-lg rounded-b-3xl z-10 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-[-30px] right-[-20px] w-32 h-32 rounded-full bg-white/5 blur-sm" />
                <div className="absolute bottom-[-20px] left-[20%] w-24 h-24 rounded-full bg-white/5 blur-sm" />
                <div className="flex items-center justify-between mb-3 relative z-10">
                    <button onClick={goToPreviousStep} className="flex items-center gap-1 text-green-200 hover:text-white -ml-1 text-sm font-medium transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                    <button onClick={toggleLang} className="flex items-center justify-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs font-bold transition-colors">
                        <Globe className="w-3.5 h-3.5" />
                        {lang === 'en' ? 'EN' : 'TA'}
                    </button>
                </div>
                <div className="flex items-center gap-2 mb-2 opacity-90 relative z-10">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-widest">✨ Quote Ready</span>
                </div>
                <h1 className="text-4xl font-black mb-1 relative z-10 tracking-tight">₹ {selectedTier.total}</h1>
                <p className="text-green-100 text-sm relative z-10">{selectedTier.model}</p>
            </div>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto -mt-4">

                {/* Route Map */}
                {waypoints.length >= 2 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="h-[200px] w-full">
                            <RouteMap waypoints={waypoints} />
                        </div>
                        <div className="p-3 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-600 shrink-0" />
                                <span className="text-gray-700 font-medium truncate">{data.pickupLocation.split(',')[0]}</span>
                                <span className="text-gray-400">→</span>
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                                <span className="text-gray-700 font-medium truncate">{dest.split(',')[0] || '...'}</span>
                            </div>
                            <div className="font-bold text-gray-900 shrink-0 ml-2">{quote.distance} km</div>
                        </div>
                    </div>
                )}

                {/* Selected Pricing */}
                <div className="space-y-3">
                    {(() => {
                        const config = {
                            scheduled: { icon: Calendar, iconColor: 'text-blue-600', borderColor: 'border-blue-500', bgColor: 'bg-blue-500' },
                            dedicated: { icon: Truck, iconColor: 'text-orange-600', borderColor: 'border-orange-500', bgColor: 'bg-orange-500' },
                            express: { icon: Zap, iconColor: 'text-purple-600', borderColor: 'border-purple-500', bgColor: 'bg-purple-500' },
                        }[serviceType];
                        return (
                            <PricingCard
                                tier={selectedTier}
                                isSelected={true}
                                isRecommended={true}
                                icon={config.icon}
                                iconColor={config.iconColor}
                                borderColor={config.borderColor}
                                bgColor={config.bgColor}
                                tripInfo={{
                                    pickup: data.pickupLocation,
                                    drop: dest,
                                    stops: data.deliveryType === 'multiple' ? (data.stops || []) : [],
                                    distance: quote.distance,
                                    weight: quote.weight,
                                    waitingHours: data.expectedWaitingHours || 0,
                                    deliveryType: data.deliveryType || 'single',
                                }}
                            />
                        );
                    })()}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-gray-100 space-y-3 pb-8">
                <button
                    onClick={handleWhatsApp}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-lg font-bold bg-[#25D366] text-white hover:bg-[#128C7E] transform active:scale-95 shadow-md transition-all"
                >
                    <MessageCircle className="w-5 h-5" />
                    BOOK ON WHATSAPP
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => window.open('tel:+916381065877')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                        <Phone className="w-4 h-4" />
                        CALL US
                    </button>
                    <button
                        onClick={resetWizard}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        <RotateCcw className="w-4 h-4" />
                        RESTART
                    </button>
                </div>
            </div>
        </div>
    );
}
