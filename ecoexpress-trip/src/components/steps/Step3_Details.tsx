'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '@/components/wizard/WizardManager';
import { ChevronLeft, ChevronRight, Globe, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { TRANSLATIONS } from '@/lib/translations';

const WEIGHT_PRESETS = [10, 25, 50, 100, 250, 500];

export function Step3Details() {
    const { data, updateData, goToNextStep, goToPreviousStep, lang, toggleLang } = useWizard();
    const t = TRANSLATIONS[lang];

    const [localWeight, setLocalWeight] = useState(String(data.weight));
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => { setLocalWeight(String(data.weight)); }, [data.weight]);

    const syncWeight = (val: string) => {
        const num = parseInt(val) || 0;
        updateData({ weight: Math.max(1, Math.min(1000, num)) });
    };

    const handleWeightInput = (val: string) => {
        setLocalWeight(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => syncWeight(val), 500);
    };

    const handleWeightBlur = () => { clearTimeout(debounceRef.current); syncWeight(localWeight); };
    const handleWeightChange = (delta: number) => {
        const newWeight = Math.max(1, Math.min(1000, data.weight + delta));
        updateData({ weight: newWeight });
    };

    const isDedicated = data.serviceType === 'dedicated';
    const displayWeight = parseInt(localWeight) || 0;
    const capacityPercent = Math.min(100, (displayWeight / 1000) * 100);

    const barColor = capacityPercent > 80 ? 'from-orange-400 to-red-500'
        : capacityPercent > 50 ? 'from-amber-400 to-orange-400'
            : 'from-green-400 to-emerald-500';

    const vehicleLabel = displayWeight > 500 ? '🚛 Lorry / Container'
        : displayWeight > 100 ? '🚐 Tempo / Tata Ace'
            : displayWeight > 30 ? '🛵 Scooter / Mini Auto'
                : '🏍️ Bike';

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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.stepOf} 3 {t.of} 4</p>
                        <h2 className="text-base font-black text-gray-800">{t.step3Title}</h2>
                    </div>
                    <button onClick={toggleLang} className="flex flex-col items-center p-2 text-gray-500 hover:text-primary rounded-xl transition-colors">
                        <Globe className="w-4 h-4" />
                        <span className="text-[9px] font-bold mt-0.5">{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
                <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

                {/* Weight control */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{t.weightLabel}</p>

                    <div className="flex items-center justify-between gap-4 mb-5">
                        <button
                            onClick={() => handleWeightChange(-5)}
                            className="w-14 h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-90 text-3xl font-bold text-gray-600 flex items-center justify-center transition-all shadow-sm"
                        >
                            −
                        </button>
                        <div className="flex-1 text-center">
                            <input
                                type="number"
                                value={localWeight}
                                onChange={(e) => handleWeightInput(e.target.value)}
                                onBlur={handleWeightBlur}
                                className="w-28 text-5xl font-black text-green-600 text-center bg-transparent outline-none border-b-2 border-transparent focus:border-green-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min={1}
                                max={1000}
                            />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t.kilograms}</p>
                        </div>
                        <button
                            onClick={() => handleWeightChange(5)}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white text-3xl font-bold flex items-center justify-center active:scale-90 shadow-xl shadow-green-200/50 transition-all"
                        >
                            +
                        </button>
                    </div>

                    {/* Quick presets */}
                    <div className="grid grid-cols-6 gap-1.5">
                        {WEIGHT_PRESETS.map(w => (
                            <button
                                key={w}
                                onClick={() => { setLocalWeight(String(w)); syncWeight(String(w)); }}
                                className={clsx(
                                    'py-2 rounded-xl text-xs font-bold transition-all',
                                    data.weight === w ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                            >
                                {w}
                            </button>
                        ))}
                    </div>

                    {displayWeight < 10 && (
                        <div className="mt-3 p-2.5 bg-red-50 text-red-600 text-xs font-medium rounded-xl text-center">{t.weightMin}</div>
                    )}
                    {displayWeight > 500 && (
                        <div className="mt-3 p-2.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-xl text-center">{t.weightBulk}</div>
                    )}
                </div>

                {/* Capacity bar */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.vehicleCapacity}</p>
                        <p className="text-xs font-bold text-gray-700">{displayWeight} / 1000 kg</p>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                            style={{ width: `${capacityPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{vehicleLabel}</p>
                </div>

                {/* Product type */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t.productType}</p>
                    <input
                        type="text"
                        placeholder={t.productPlaceholder}
                        value={data.productType || ''}
                        onChange={(e) => updateData({ productType: e.target.value })}
                        className="w-full py-3.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-50 transition-all bg-gray-50 focus:bg-white"
                    />
                </div>

                {/* Waiting time — Dedicated only */}
                {isDedicated && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t.waitingTime}</p>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-4xl font-black text-orange-500">{data.expectedWaitingHours}</span>
                            <span className="text-sm font-bold text-gray-400 uppercase">{t.hours}</span>
                        </div>
                        <input
                            type="range" min={0.5} max={5} step={0.5}
                            value={data.expectedWaitingHours}
                            onChange={(e) => updateData({ expectedWaitingHours: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500 mb-3"
                        />
                        <div className="flex justify-between text-xs text-gray-400 font-medium mb-3">
                            <span>0.5h</span>
                            <span>2.5h</span>
                            <span>5h</span>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 font-medium">{t.waitingFree}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-white border-t border-gray-100">
                <button
                    onClick={goToNextStep}
                    className="w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-md shadow-green-200/50 active:scale-[0.97] transition-all"
                >
                    {t.getPrice}
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
