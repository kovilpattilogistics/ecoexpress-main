'use client';

import React from 'react';
import { ArrowRight, Truck, Clock, ShieldCheck, Globe, CheckCircle2 } from 'lucide-react';
import { useWizard } from '@/components/wizard/WizardManager';
import { TRANSLATIONS } from '@/lib/translations';

export function Step0Landing() {
    const { goToNextStep, lang, toggleLang } = useWizard();
    const t = TRANSLATIONS[lang];

    const features = [
        { icon: CheckCircle2, label: t.tripFeature1 },
        { icon: CheckCircle2, label: t.tripFeature2 },
        { icon: CheckCircle2, label: t.tripFeature3 },
    ];

    const services = [
        {
            icon: '📅',
            title: lang === 'en' ? 'Scheduled' : 'திட்டமிடப்பட்டது',
            desc: lang === 'en' ? 'Mon/Wed/Fri/Sat' : 'திங்கள்/புதன்/வெள்ளி/சனி',
            color: 'bg-blue-50 border-blue-100',
            iconBg: 'bg-blue-100',
        },
        {
            icon: '🚛',
            title: lang === 'en' ? 'Dedicated' : 'அர்ப்பணிப்பு',
            desc: lang === 'en' ? 'Any time, exclusive truck' : 'எந்த நேரமும், தனி வாகனம்',
            color: 'bg-orange-50 border-orange-100',
            iconBg: 'bg-orange-100',
        },
        {
            icon: '⚡',
            title: lang === 'en' ? 'Express' : 'விரைவு',
            desc: lang === 'en' ? 'Same-day priority' : 'அதே நாள் டெலிவரி',
            color: 'bg-purple-50 border-purple-100',
            iconBg: 'bg-purple-100',
        },
    ];

    return (
        <div className="flex flex-col min-h-full bg-white overflow-y-auto">
            {/* Hero Banner */}
            <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 px-6 pt-10 pb-16 overflow-hidden">
                {/* Background decorations */}
                <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-black/10 blur-2xl" />

                {/* Language Toggle */}
                <div className="flex justify-end mb-6 relative z-10">
                    <button
                        onClick={toggleLang}
                        className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-full border border-white/20 transition-all"
                    >
                        <Globe className="w-3.5 h-3.5" />
                        {lang === 'en' ? 'தமிழ்' : 'English'}
                    </button>
                </div>

                {/* Logo & Title */}
                <div className="flex flex-col items-center text-center relative z-10">
                    <div className="relative w-24 h-24 mb-4">
                        <div className="absolute inset-0 bg-white/20 rounded-3xl blur-lg" />
                        <div className="relative w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center overflow-hidden">
                            <img
                                src="/ecoexpress-trip/logo.png"
                                alt="EcoExpress"
                                className="w-20 h-20 object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    </div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.2em] mb-1">EcoExpress Logistics</p>
                    <h1 className="text-3xl font-black text-white leading-tight mb-3">
                        {t.tripHero}
                    </h1>
                    <p className="text-green-100 text-sm leading-relaxed max-w-xs">
                        {t.tripTagline}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 -mt-6 relative z-10 flex flex-col gap-5 pb-8">

                {/* Service Cards */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {services.map((svc, i) => (
                        <div key={i} className={`flex items-center gap-4 px-4 py-3.5 ${i < services.length - 1 ? 'border-b border-gray-100' : ''}`}>
                            <div className={`w-10 h-10 ${svc.iconBg} rounded-xl flex items-center justify-center text-xl shrink-0`}>
                                {svc.icon}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{svc.title}</p>
                                <p className="text-xs text-gray-500">{svc.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Feature Pills */}
                <div className="flex flex-col gap-2">
                    {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <f.icon className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">{f.label}</span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={goToNextStep}
                    className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-green-200/60 flex items-center justify-center gap-3 active:scale-[0.97] transition-all"
                >
                    <Truck className="w-5 h-5" />
                    {t.tripStart}
                    <ArrowRight className="w-5 h-5" />
                </button>

                {/* Trust note */}
                <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span>{lang === 'en' ? 'Trusted by local businesses' : 'உள்ளூர் வணிகர்கள் நம்பும் சேவை'}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span>{lang === 'en' ? 'Quotes in seconds' : 'விலை உடனே'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
