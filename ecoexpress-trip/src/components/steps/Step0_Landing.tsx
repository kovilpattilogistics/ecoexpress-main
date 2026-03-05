import React from 'react';
import { ArrowRight, MapPin, Sparkles, Truck, Shield, Leaf, Globe } from 'lucide-react';
import { useWizard } from '@/components/wizard/WizardManager';

export function Step0Landing() {
    const { goToNextStep, lang, toggleLang } = useWizard();
    const isTa = lang === 'ta';

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-green-50 via-white to-white relative overflow-hidden">
            {/* Decorative background circles */}
            <div className="absolute top-[-60px] right-[-60px] w-48 h-48 rounded-full bg-green-100/50 blur-2xl" />
            <div className="absolute bottom-[30%] left-[-40px] w-32 h-32 rounded-full bg-emerald-100/40 blur-xl" />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5 relative z-10">
                {/* Language Toggle */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={toggleLang}
                        className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-primary bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1 transition shadow-sm"
                    >
                        <Globe className="w-4 h-4" />
                        {isTa ? 'தமிழ்' : 'English'}
                    </button>
                </div>

                {/* Logo */}
                <div className="relative w-36 h-36 mb-2">
                    <div className="absolute inset-0 bg-green-200/30 rounded-full blur-xl animate-pulse" />
                    <img
                        src="/ecoexpress-trip/logo.png"
                        alt="EcoExpress Logo"
                        className="w-full h-full object-contain drop-shadow-lg relative z-10"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                    Eco<span className="text-primary">Express</span>
                </h1>

                <div className="space-y-2 max-w-xs mx-auto">
                    <p className="text-lg font-medium text-gray-800 flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        {isTa
                            ? <><span className="text-primary font-bold">30 நொடியில்</span>&nbsp;விலை பெறுங்கள்</>
                            : <>Get your price in <span className="text-primary font-bold">30 seconds</span></>}
                    </p>
                    <p className="text-sm text-gray-500">
                        {isTa
                            ? 'கோவில்பட்டி மற்றும் சுற்றியுள்ள பகுதிகளுக்கு உடனடி மேற்கோள்'
                            : 'Instant quotes for Kovilpatti & surrounding areas'}
                    </p>
                </div>

                {/* Start Button */}
                <button
                    onClick={goToNextStep}
                    className="group w-full max-w-xs bg-gradient-to-r from-primary to-emerald-600 hover:from-[#1b5e20] hover:to-emerald-700 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-lg shadow-green-200/50 transform transition-all active:scale-95 flex items-center justify-center gap-2 mt-6"
                >
                    {isTa ? 'கணக்கீடு தொடங்கு' : 'START CALCULATION'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Trust badges */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-t-3xl border-t border-gray-100 relative z-10">
                <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                        { icon: Leaf, label: isTa ? 'இவி டெலிவரி' : 'EV Delivery', color: 'text-green-600' },
                        { icon: Shield, label: isTa ? 'நிலையான விலை' : 'Fixed Price', color: 'text-blue-600' },
                        { icon: Truck, label: isTa ? 'ஆவணம் உட்பட' : 'POD Included', color: 'text-orange-600' },
                        { icon: Sparkles, label: isTa ? 'உடனே பதிவு' : 'Instant Book', color: 'text-purple-600' },
                    ].map((badge) => (
                        <div key={badge.label} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50/80">
                            <badge.icon className={`w-4 h-4 ${badge.color}`} />
                            <span className="text-sm text-gray-700 font-medium">{badge.label}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                {isTa ? 'மண்டலம்-A பகுதி' : 'Zone-A Coverage'}
                            </h3>
                            <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                Kovilpatti • Kalugumalai • Sankarankoil • Tiruvengadam
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
