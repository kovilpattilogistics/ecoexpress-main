import React from 'react';
import logoSrc from '@/assets/logo.png';
import DriverRouteMap, { DriverMapWaypoint } from '@/components/driver/DriverRouteMap';
import RouteMap from '@/components/ui/RouteMap';

interface Props {
    title?: string;
    invoiceNo?: string;
    date: Date;
    customerName?: string;
    category: string;
    distanceKm: number;
    durationStr?: string;
    weightKg?: number;
    waitingHours?: number;
    basePrice: number;
    distanceCharge?: number;
    weightCharge?: number;
    waitingCharge?: number;
    extraStopsCharge?: number;
    extraTimeCharge?: number;
    total: number;
    note?: string;
    waypoints?: any[];
    isDriver?: boolean;
}

export default function PrintInvoiceTemplate(props: Props) {
    const {
        title = "INVOICE",
        invoiceNo = `EEL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        date,
        customerName,
        category,
        distanceKm,
        durationStr,
        weightKg,
        waitingHours,
        basePrice,
        distanceCharge = 0,
        weightCharge = 0,
        waitingCharge = 0,
        extraStopsCharge = 0,
        extraTimeCharge = 0,
        total,
        note,
        waypoints,
        isDriver
    } = props;

    return (
        <div className="hidden print:block w-full bg-white text-gray-900 absolute top-0 left-0 bg-white z-[9999] min-h-screen">
            {/* The A4 page wrapper */}
            <div className="max-w-[800px] mx-auto p-10 bg-white">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <img src={logoSrc} alt="EcoExpress" className="w-20 h-20 object-contain" />
                        <div>
                            <h1 className="text-3xl font-bold text-green-800 tracking-tight m-0">EcoExpress Logistics</h1>
                            <p className="text-sm text-gray-500 italic mt-1">Clean Water. Fast Delivery. Eco Future.</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-black text-green-700 tracking-widest uppercase m-0 mb-2">{title}</h2>
                        <table className="ml-auto text-sm text-gray-700">
                            <tbody>
                                <tr>
                                    <td className="text-right pr-2 text-gray-500">Invoice No:</td>
                                    <td className="font-bold">{invoiceNo}</td>
                                </tr>
                                <tr>
                                    <td className="text-right pr-2 text-gray-500">Date:</td>
                                    <td className="font-bold">{date.toLocaleDateString('en-IN')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="h-1 w-full bg-green-600 mb-6"></div>

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="border border-green-200 rounded-lg overflow-hidden">
                        <div className="bg-green-50 px-4 py-2 border-b border-green-200 text-green-800 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <span>🏢 FROM (COMPANY)</span>
                        </div>
                        <div className="p-4 text-sm leading-relaxed text-gray-800">
                            <strong>EcoExpress Logistics</strong><br/>
                            36/A, Valluvar Nagar,<br/>
                            Kadalaiyur Road, Kovilpatti – 628 501<br/>
                            Tamil Nadu, India<br/>
                            📞 +91 63810 65877
                        </div>
                    </div>

                    <div className="border border-green-200 rounded-lg overflow-hidden">
                        <div className="bg-green-50 px-4 py-2 border-b border-green-200 text-green-800 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <span>👤 BILL TO (CUSTOMER)</span>
                        </div>
                        <div className="p-4 text-sm leading-relaxed text-gray-800">
                            <strong>{customerName || 'Cash Customer'}</strong><br/>
                            Service: {category}<br/>
                            Distance: {distanceKm} km<br/>
                            {durationStr && <>Duration: {durationStr}<br/></>}
                            {weightKg != null && <>Cargo: {weightKg} kg<br/></>}
                        </div>
                    </div>
                </div>

                {/* Fare Breakdown Table */}
                <div className="border border-gray-300 rounded-lg overflow-hidden mb-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-green-700 text-white text-sm">
                                <th className="py-2 px-4 font-bold w-12">#</th>
                                <th className="py-2 px-4 font-bold">Description</th>
                                <th className="py-2 px-4 font-bold text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-gray-200">
                                <td className="py-3 px-4 text-gray-600">1</td>
                                <td className="py-3 px-4 font-medium text-gray-800">Base Fare</td>
                                <td className="py-3 px-4 text-right text-gray-800">{basePrice.toFixed(2)}</td>
                            </tr>
                            {distanceCharge > 0 && (
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-gray-600">2</td>
                                    <td className="py-3 px-4 font-medium text-gray-800">Distance Charge</td>
                                    <td className="py-3 px-4 text-right text-gray-800">{distanceCharge.toFixed(2)}</td>
                                </tr>
                            )}
                            {weightCharge > 0 && (
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-gray-600">3</td>
                                    <td className="py-3 px-4 font-medium text-gray-800">Weight Charge</td>
                                    <td className="py-3 px-4 text-right text-gray-800">{weightCharge.toFixed(2)}</td>
                                </tr>
                            )}
                            {waitingCharge > 0 && (
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-gray-600">4</td>
                                    <td className="py-3 px-4 font-medium text-gray-800">Waiting Charge</td>
                                    <td className="py-3 px-4 text-right text-gray-800">{waitingCharge.toFixed(2)}</td>
                                </tr>
                            )}
                            {extraStopsCharge > 0 && (
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-gray-600">5</td>
                                    <td className="py-3 px-4 font-medium text-gray-800">Extra Stops</td>
                                    <td className="py-3 px-4 text-right text-gray-800">{extraStopsCharge.toFixed(2)}</td>
                                </tr>
                            )}
                            {extraTimeCharge > 0 && (
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-gray-600">6</td>
                                    <td className="py-3 px-4 font-medium text-gray-800">Extra Time</td>
                                    <td className="py-3 px-4 text-right text-gray-800">{extraTimeCharge.toFixed(2)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    
                    {/* Total Section */}
                    <div className="flex justify-end bg-gray-50 border-t border-gray-300 p-6">
                        <div className="w-1/2">
                            <table className="w-full text-right text-sm">
                                <tbody>
                                    <tr>
                                        <td className="py-1 pr-4 text-gray-600 font-bold uppercase tracking-widest text-xs">Sub-Total</td>
                                        <td className="py-1 font-bold text-gray-800">₹ {total.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 text-gray-600 font-bold uppercase tracking-widest text-xs">Tax / GST</td>
                                        <td className="py-1 font-bold text-gray-800">₹ 0.00</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="pt-3">
                                            <div className="bg-green-700 text-white rounded px-4 py-3 flex justify-between items-center">
                                                <span className="font-bold uppercase tracking-widest">Grand Total</span>
                                                <span className="text-xl font-black">₹ {total.toLocaleString('en-IN')}</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Map Section */}
                {waypoints && waypoints.length > 0 && (
                    <div className="mt-8 border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-widest">
                            Route Verification Map ({distanceKm} km)
                        </div>
                        <div className="h-[250px] w-full relative z-0">
                            {isDriver ? (
                                <DriverRouteMap waypoints={waypoints} height={250} />
                            ) : (
                                <RouteMap waypoints={waypoints} />
                            )}
                        </div>
                    </div>
                )}
                
                {/* Footer Notes */}
                {note && (
                    <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
                        {note}
                    </div>
                )}
                <div className="mt-2 text-xs text-gray-400 text-center pb-10">
                    Generated on {new Date().toLocaleString('en-IN')} via EcoExpress Logistics App
                </div>
            </div>
        </div>
    );
}
