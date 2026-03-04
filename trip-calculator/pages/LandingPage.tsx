import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    // Helper for asset paths
    const getAssetPath = (path: string) => {
        const base = window.location.pathname.startsWith('/trip-calculator') ? '/trip-calculator' : '';
        return `${base}${path}`;
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <img src={getAssetPath('/logo.png')} alt="EcoExpress" className="w-8 h-8 object-contain" />
                            <span className="font-bold text-xl text-gray-900">Eco<span className="text-primary">Express</span></span>
                        </div>
                        <div className="flex items-center gap-4">


                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                            Sustainable Logistics for a <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-700">Greener Future</span>
                        </h1>
                        <p className="text-xl text-gray-500 mb-8">
                            Join the revolution in eco-friendly transportation. We combine EV fleets, smart warehousing, and AI-driven routes to reduce carbon footprint.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/book')}
                                className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-green-200 hover:bg-primaryDark hover:-translate-y-1 transition-all flex items-center justify-center"
                            >
                                Book Now <ArrowRight className="ml-2 w-5 h-5" />
                            </button>

                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Showcase Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="group relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] cursor-pointer">
                        <img src={getAssetPath('/hero-truck.png')} alt="EV Fleet" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"></div>
                        <div className="absolute bottom-0 left-0 p-8 text-white">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4 text-white">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">100% Electric Fleet</h3>
                            <p className="text-gray-300 text-sm">Zero emissions, maximum efficiency. Our modern fleet ensures your goods move cleanly.</p>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="group relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] cursor-pointer md:-translate-y-12">
                        <img src={getAssetPath('/hero-warehouse.png')} alt="Smart Warehousing" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"></div>
                        <div className="absolute bottom-0 left-0 p-8 text-white">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4 text-white">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Smart Warehousing</h3>
                            <p className="text-gray-300 text-sm">Automated sorting and AI-driven inventory management for faster throughput.</p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="group relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] cursor-pointer">
                        <img src={getAssetPath('/hero-logistics.png')} alt="Global Network" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"></div>
                        <div className="absolute bottom-0 left-0 p-8 text-white">
                            <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center mb-4 text-white">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Connected Logistics</h3>
                            <p className="text-gray-300 text-sm">Real-time tracking and optimized routing across land, sea, and air.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Simple */}
            <footer className="bg-gray-50 border-t border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm">© 2026 EcoExpress Logistics. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};
