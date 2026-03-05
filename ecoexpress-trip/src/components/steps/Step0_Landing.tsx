'use client';

import React from 'react';
import { ArrowRight, Truck, Globe, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { useWizard } from '@/components/wizard/WizardManager';
import { TRANSLATIONS } from '@/lib/translations';
import logoSrc from '@/assets/logo.png';

export function Step0Landing() {
    const { goToNextStep, lang, toggleLang } = useWizard();
    const t = TRANSLATIONS[lang];

    const features = [
        t.tripFeature1,
        t.tripFeature2,
        t.tripFeature3,
    ];

    const services = [
        { emoji: '🚛', title: t.dedicatedLabel, desc: t.dedicatedDesc, iconBg: 'bg-orange-100' },
        { emoji: '📅', title: t.scheduledLabel, desc: t.scheduledDesc, iconBg: 'bg-blue-100' },
        { emoji: '⚡', title: t.expressLabel, desc: t.expressDesc, iconBg: 'bg-purple-100' },
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white">

            {/* Hero */}
            <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 px-6 pt-6 pb-10 shrink-0">
                <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                {/* Language toggle */}
                <div className="flex justify-end mb-5">
                    <button
                        onClick={toggleLang}
                        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 transition-all"
                    >
                        <Globe className="w-3.5 h-3.5" />
                        {lang === 'en' ? 'தமிழ்' : 'English'}
                    </button>
                </div>

                {/* Logo + Title — logo on green background, no white card */}
                <div className="flex items-center gap-4">
                    <img
                        src={logoSrc}
                        alt="EcoExpress"
                        className="w-16 h-16 object-contain rounded-2xl shrink-0 bg-white p-1 shadow-lg"
                    />
                    <div>
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">EcoExpress Logistics</p>
                        <h1 className="text-2xl font-black text-white leading-tight">{t.tripHero}</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 space-y-4">

                {/* Tagline */}
                <p className="text-sm text-gray-500 leading-relaxed">{t.tripTagline}</p>

                {/* Services */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                    {services.map((svc, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                            <div className={`w-10 h-10 ${svc.iconBg} rounded-xl flex items-center justify-center text-xl shrink-0`}>
                                {svc.emoji}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{svc.title}</p>
                                <p className="text-xs text-gray-500">{svc.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Features */}
                <div className="flex flex-col gap-2">
                    {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-sm text-gray-600 font-medium">{f}</span>
                        </div>
                    ))}
                </div>

                {/* Trust bar */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                        <span>{lang === 'en' ? 'Trusted locally' : 'நம்பகமான சேவை'}</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-green-500" />
                        <span>{lang === 'en' ? 'Quote in seconds' : 'விலை உடனே'}</span>
                    </div>
                </div>
            </div>

            {/* Sticky CTA */}
            <div className="px-5 pb-6 pt-3 bg-white border-t border-gray-100 shrink-0">
                <button
                    onClick={goToNextStep}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black text-base rounded-2xl shadow-lg shadow-green-200/50 flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                >
                    <Truck className="w-4 h-4" />
                    {t.tripStart}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
