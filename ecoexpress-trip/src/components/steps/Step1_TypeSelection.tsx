'use client';

import React from 'react';
import { useWizard } from '@/components/wizard/WizardManager';
import { Store, Truck, ChevronRight, ChevronLeft, Calendar, Zap, TruckIcon, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { TRANSLATIONS } from '@/lib/translations';

export function Step1TypeSelection() {
    const { data, updateData, goToNextStep, goToPreviousStep, lang, toggleLang } = useWizard();
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

    const handleDeliverySelect = (type: 'single' | 'multiple') => {
        updateData({ deliveryType: type });
    };

    const handleServiceSelect = (type: 'scheduled' | 'dedicated' | 'express') => {
        updateData({ serviceType: type });
    };

    const serviceTypes = [
        {
            id: 'dedicated' as const,
            label: lang === 'ta' ? 'டெடிகேட்டட்' : 'Dedicated (Full Vehicle)',
            desc: lang === 'ta' ? 'முழு வாகனம் - நேரடி டோர்-டு-டோர்' : 'Exclusive vehicle, door-to-door.',
            icon: TruckIcon,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            bgSolid: 'bg-orange-500',
            ring: 'ring-orange-500',
            border: 'border-orange-500',
            gradient: 'from-orange-50 to-orange-100/50',
        },
        {
            id: 'scheduled' as const,
            label: lang === 'ta' ? 'திட்டமிடப்பட்டது' : 'Scheduled',
            desc: lang === 'ta' ? 'திங்கள்/புத/வெள்/சனி. இரவு 8க்குள் பதிவு செய்யவும்.' : 'Mon/Wed/Fri/Sat. Book by 8 PM.',
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            bgSolid: 'bg-blue-500',
            ring: 'ring-blue-500',
            border: 'border-blue-500',
            gradient: 'from-blue-50 to-blue-100/50',
        },
        {
            id: 'express' as const,
            label: lang === 'ta' ? 'எக்ஸ்பிரஸ்' : 'Express',
            desc: lang === 'ta' ? 'அதே நாள் முன்னுரிமை டெலிவரி.' : 'Priority same-day delivery.',
            icon: Zap,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            bgSolid: 'bg-purple-500',
            ring: 'ring-purple-500',
            border: 'border-purple-500',
            gradient: 'from-purple-50 to-purple-100/50',
        },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm z-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" />
                <div className="flex items-center justify-between mb-2">
                    <button onClick={goToPreviousStep} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 1 of 4</span>
                    <button onClick={toggleLang} className="flex flex-col items-center justify-center p-1 text-gray-500 hover:text-primary transition-colors border border-transparent rounded-lg">
                        <Globe className="w-5 h-5" />
                        <span className="text-[10px] leading-none mt-0.5">{lang === 'en' ? 'EN' : 'TA'}</span>
                    </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    Configure your delivery
                </h2>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                {/* Delivery Type */}
                <section>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">
                        Delivery Type
                    </label>
                    <div className="flex gap-3">
                        {/* Single Drop */}
                        <button
                            onClick={() => handleDeliverySelect('single')}
                            className={clsx(
                                'flex-1 text-left bg-white p-4 rounded-2xl shadow-sm border-2 transition-all duration-300',
                                data.deliveryType === 'single'
                                    ? 'border-primary bg-gradient-to-br from-green-50 to-emerald-50 shadow-md ring-1 ring-primary scale-[1.02]'
                                    : 'border-transparent hover:border-gray-200 hover:shadow-md'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                    data.deliveryType === 'single' ? "bg-primary text-white shadow-lg shadow-green-200" : "bg-gray-100 text-gray-500"
                                )}>
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={clsx("font-bold text-sm", data.deliveryType === 'single' ? "text-primary" : "text-gray-900")}>
                                        SINGLE DROP
                                    </h3>
                                    <p className="text-xs text-gray-500">One pickup → one drop</p>
                                </div>
                            </div>
                        </button>

                        {/* Multiple Drop */}
                        <button
                            onClick={() => handleDeliverySelect('multiple')}
                            className={clsx(
                                'flex-1 text-left bg-white p-4 rounded-2xl shadow-sm border-2 transition-all duration-300',
                                data.deliveryType === 'multiple'
                                    ? 'border-primary bg-gradient-to-br from-green-50 to-emerald-50 shadow-md ring-1 ring-primary scale-[1.02]'
                                    : 'border-transparent hover:border-gray-200 hover:shadow-md'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                    data.deliveryType === 'multiple' ? "bg-primary text-white shadow-lg shadow-green-200" : "bg-gray-100 text-gray-500"
                                )}>
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={clsx("font-bold text-sm", data.deliveryType === 'multiple' ? "text-primary" : "text-gray-900")}>
                                        MULTIPLE DROP
                                    </h3>
                                    <p className="text-xs text-gray-500">2-30 drop stops</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Service Type */}
                <section>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">
                        Service Type
                    </label>
                    <div className="space-y-2.5">
                        {serviceTypes.map((svc) => {
                            const Icon = svc.icon;
                            const isSelected = data.serviceType === svc.id;
                            return (
                                <button
                                    key={svc.id}
                                    onClick={() => handleServiceSelect(svc.id)}
                                    className={clsx(
                                        'w-full text-left bg-white p-4 rounded-2xl shadow-sm border-2 transition-all duration-300 flex items-center gap-4',
                                        isSelected
                                            ? `${svc.border} bg-gradient-to-r ${svc.gradient} shadow-md ring-1 ${svc.ring} scale-[1.01]`
                                            : 'border-transparent hover:border-gray-200 hover:shadow-md'
                                    )}
                                >
                                    <div className={clsx(
                                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                        isSelected ? `${svc.bgSolid} text-white shadow-lg` : "bg-gray-100 text-gray-400"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={clsx("font-bold text-sm", isSelected ? svc.color : "text-gray-900")}>
                                            {svc.label.toUpperCase()}
                                        </h3>
                                        <p className="text-xs text-gray-500 truncate">{svc.desc}</p>
                                    </div>
                                    {isSelected && (
                                        <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md", svc.bgSolid)}>
                                            ✓
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Service info tip */}
                {data.serviceType && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 text-xs text-amber-800 font-medium flex items-start gap-2.5">
                        <span className="text-base">💡</span>
                        <span>
                            {data.serviceType === 'scheduled' && 'Scheduled routes run Mon/Wed/Fri/Sat. Book by previous day 8 PM for next-day delivery.'}
                            {data.serviceType === 'dedicated' && 'Dedicated trips give you an exclusive vehicle. Best for urgent or heavy shipments.'}
                            {data.serviceType === 'express' && 'Express is 1.7× the scheduled rate for same-day priority delivery.'}
                        </span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100">
                <button
                    onClick={goToNextStep}
                    disabled={!data.deliveryType}
                    className={clsx(
                        'w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-bold transition-all shadow-md',
                        data.deliveryType
                            ? 'bg-gradient-to-r from-primary to-emerald-600 text-white hover:from-[#1b5e20] hover:to-emerald-700 transform active:scale-95 shadow-green-200/50'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    )}
                >
                    CONTINUE
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
