'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '@/components/wizard/WizardManager';
import { ChevronLeft, ChevronRight, Package, Scale, ShoppingBag, Clock, Info } from 'lucide-react';
import { clsx } from 'clsx';

const WEIGHT_PRESETS = [10, 25, 50, 100, 250, 500];

export function Step3Details() {
    const { data, updateData, goToNextStep, goToPreviousStep } = useWizard();

    // Local weight state for smooth typing
    const [localWeight, setLocalWeight] = useState(String(data.weight));
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        setLocalWeight(String(data.weight));
    }, [data.weight]);

    const syncWeight = (val: string) => {
        const num = parseInt(val) || 0;
        const clamped = Math.max(1, Math.min(1000, num));
        updateData({ weight: clamped });
    };

    const handleWeightInput = (val: string) => {
        setLocalWeight(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => syncWeight(val), 500);
    };

    const handleWeightBlur = () => {
        clearTimeout(debounceRef.current);
        syncWeight(localWeight);
    };

    const handleWeightChange = (delta: number) => {
        const newWeight = Math.max(1, Math.min(1000, data.weight + delta));
        updateData({ weight: newWeight });
    };

    const handleWaitingChange = (value: number) => {
        updateData({ expectedWaitingHours: value });
    };

    const isDedicated = data.serviceType === 'dedicated';
    const displayWeight = parseInt(localWeight) || 0;
    const capacityPercent = Math.min(100, (displayWeight / 1000) * 100);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm z-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" />
                <div className="flex items-center justify-between mb-2">
                    <button onClick={goToPreviousStep} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 3 of 4</span>
                    <div className="w-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    What are you sending?
                </h2>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                {/* Weight Section */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Scale className="w-4 h-4" />
                            Weight (Kg)
                        </label>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={() => handleWeightChange(-5)}
                                className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-600 active:bg-gray-200 shadow-sm hover:shadow-md transition-all"
                            >
                                -
                            </button>

                            <div className="flex-1 text-center">
                                <input
                                    type="number"
                                    value={localWeight}
                                    onChange={(e) => handleWeightInput(e.target.value)}
                                    onBlur={handleWeightBlur}
                                    className="w-24 text-5xl font-black text-[var(--primary)] tracking-tight text-center bg-transparent outline-none border-b-2 border-transparent focus:border-[var(--primary)] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min={1}
                                    max={1000}
                                />
                                <div className="text-sm font-medium text-gray-400 uppercase mt-1">Kilograms</div>
                            </div>

                            <button
                                onClick={() => handleWeightChange(5)}
                                className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--primary)] to-emerald-600 flex items-center justify-center text-3xl font-bold text-white active:from-[#1b5e20] shadow-xl shadow-green-200/50 hover:shadow-green-300/50 transition-all"
                            >
                                +
                            </button>
                        </div>

                        {/* Quick presets */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            {WEIGHT_PRESETS.map(w => (
                                <button
                                    key={w}
                                    onClick={() => { setLocalWeight(String(w)); syncWeight(String(w)); }}
                                    className={clsx(
                                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                                        data.weight === w
                                            ? "bg-[var(--primary)] text-white shadow-md"
                                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                    )}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>

                        {displayWeight < 10 && (
                            <div className="mt-3 p-2.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg text-center">
                                ⚠️ Minimum weight is 10 kg
                            </div>
                        )}
                        {displayWeight > 500 && (
                            <div className="mt-3 p-2.5 bg-orange-50 text-orange-700 text-xs font-medium rounded-lg text-center">
                                ℹ️ For bulk orders &gt;500kg, better rates may apply via call.
                            </div>
                        )}
                    </div>
                </section>

                {/* Capacity Bar */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Vehicle Capacity</span>
                        <span className="text-xs font-bold text-gray-700">{displayWeight} / 1000 kg</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={clsx(
                                "h-full rounded-full transition-all duration-500 ease-out",
                                capacityPercent > 80 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                                    capacityPercent > 50 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                                        'bg-gradient-to-r from-green-400 to-emerald-500'
                            )}
                            style={{ width: `${capacityPercent}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                        {displayWeight > 100 ? '🚛 Cargo Auto / Tata Ace' : '🏍️ Bike / Scooter'}
                    </p>
                </div>

                {/* Product Type */}
                <section>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Product Type
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Oil Cans, Rice Bags, Electronics..."
                        value={data.productType || ''}
                        onChange={(e) => updateData({ productType: e.target.value })}
                        className="w-full bg-white p-4 rounded-xl border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-50 transition-all"
                    />
                </section>

                {/* Waiting Time - Only for Dedicated */}
                {isDedicated && (
                    <section>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Expected Unloading Time
                        </label>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-black text-orange-600">
                                    {data.expectedWaitingHours}
                                </span>
                                <span className="text-sm font-medium text-gray-400 uppercase">Hours</span>
                            </div>

                            <input
                                type="range"
                                min={0.5}
                                max={5}
                                step={0.5}
                                value={data.expectedWaitingHours}
                                onChange={(e) => handleWaitingChange(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500"
                            />

                            <div className="flex justify-between text-xs text-gray-400 font-medium">
                                <span>0.5h</span>
                                <span>2.5h</span>
                                <span>5h</span>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                                <Info className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="text-xs text-green-700 font-medium">
                                    💡 First 1 hour is <strong>FREE</strong>! Extra hours: ₹200/hour.
                                </span>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100">
                <button
                    onClick={goToNextStep}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-[var(--primary)] to-emerald-600 text-white hover:from-[#1b5e20] hover:to-emerald-700 transform active:scale-95 shadow-md shadow-green-200/50 transition-all"
                >
                    GET PRICE
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
