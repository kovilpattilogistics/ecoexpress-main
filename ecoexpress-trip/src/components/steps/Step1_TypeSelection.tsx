'use client';

import React from 'react';
import { useWizard } from '@/components/wizard/WizardManager';
import { Store, Truck, ChevronRight, ChevronLeft, Calendar, Zap, TruckIcon, Globe, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { TRANSLATIONS } from '@/lib/translations';

export function Step1TypeSelection() {
    const { data, updateData, goToNextStep, goToPreviousStep, lang, toggleLang } = useWizard();
    const t = TRANSLATIONS[lang];

    const handleDeliverySelect = (type: 'single' | 'multiple') => {
        updateData({ deliveryType: type });
    };

    const handleServiceSelect = (type: 'scheduled' | 'dedicated' | 'express') => {
        updateData({ serviceType: type });
    };

    const deliveryOptions = [
        {
            id: 'single' as const,
            label: t.singleDrop,
            desc: t.singleDropDesc,
            icon: Store,
            emoji: '📦',
        },
        {
            id: 'multiple' as const,
            label: t.multipleDrop,
            desc: t.multipleDropDesc,
            icon: Truck,
            emoji: '🔄',
        },
    ];

    const serviceOptions = [
        {
            id: 'dedicated' as const,
            label: t.dedicatedLabel,
            desc: t.dedicatedDesc,
            icon: TruckIcon,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            bgSolid: 'bg-orange-500',
            border: 'border-orange-400',
            tip: t.tipDedicated,
            emoji: '🚛',
        },
        {
            id: 'scheduled' as const,
            label: t.scheduledLabel,
            desc: t.scheduledDesc,
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            bgSolid: 'bg-blue-500',
            border: 'border-blue-400',
            tip: t.tipScheduled,
            emoji: '📅',
        },
        {
            id: 'express' as const,
            label: t.expressLabel,
            desc: t.expressDesc,
            icon: Zap,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            bgSolid: 'bg-purple-500',
            border: 'border-purple-400',
            tip: t.tipExpress,
            emoji: '⚡',
        },
    ];

    const selectedService = serviceOptions.find(s => s.id === data.serviceType);

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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.stepOf} 1 {t.of} 4</p>
                        <h2 className="text-base font-black text-gray-800">{t.step1Title}</h2>
                    </div>
                    <button
                        onClick={toggleLang}
                        className="flex flex-col items-center p-2 text-gray-500 hover:text-primary transition-colors rounded-xl"
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-[9px] font-bold mt-0.5">{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
                <div className="h-full w-1/4 bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                {/* Delivery Type */}
                <section>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t.deliveryType}</p>
                    <div className="grid grid-cols-2 gap-3">
                        {deliveryOptions.map(opt => {
                            const isSelected = data.deliveryType === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => handleDeliverySelect(opt.id)}
                                    className={clsx(
                                        'p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-2',
                                        isSelected
                                            ? 'border-primary bg-green-50 shadow-md scale-[1.02]'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    )}
                                >
                                    <span className="text-2xl">{opt.emoji}</span>
                                    <div>
                                        <p className={clsx('font-bold text-sm', isSelected ? 'text-primary' : 'text-gray-800')}>{opt.label}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                    </div>
                                    <div className={clsx(
                                        'w-5 h-5 rounded-full border-2 flex items-center justify-center self-end mt-auto',
                                        isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                                    )}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Service Type */}
                <section>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t.serviceType}</p>
                    <div className="space-y-2.5">
                        {serviceOptions.map(svc => {
                            const isSelected = data.serviceType === svc.id;
                            return (
                                <button
                                    key={svc.id}
                                    onClick={() => handleServiceSelect(svc.id)}
                                    className={clsx(
                                        'w-full text-left bg-white rounded-2xl border-2 px-4 py-3.5 flex items-center gap-3 transition-all duration-200',
                                        isSelected
                                            ? `${svc.border} shadow-md`
                                            : 'border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    <div className={clsx(
                                        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl',
                                        isSelected ? svc.bgSolid : 'bg-gray-100'
                                    )}>
                                        <span>{svc.emoji}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={clsx('font-bold text-sm', isSelected ? svc.color : 'text-gray-800')}>{svc.label}</p>
                                        <p className="text-xs text-gray-500 truncate">{svc.desc}</p>
                                    </div>
                                    <div className={clsx(
                                        'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center',
                                        isSelected ? `${svc.bgSolid} border-transparent` : 'border-gray-300'
                                    )}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Info tip */}
                {selectedService && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">{selectedService.tip}</p>
                    </div>
                )}
            </div>

            {/* Footer CTA */}
            <div className="p-5 bg-white border-t border-gray-100">
                <button
                    onClick={goToNextStep}
                    disabled={!data.deliveryType}
                    className={clsx(
                        'w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 transition-all shadow-md',
                        data.deliveryType
                            ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-green-200/50 active:scale-[0.97]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    )}
                >
                    {t.continueBtn}
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
