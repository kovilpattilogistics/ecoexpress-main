'use client';

import React, { useEffect, useState } from 'react';
import { useWizard } from '@/components/wizard/WizardManager';
import { calculateQuote, QuoteResult } from '@/lib/pricing-engine';
import { getRoadDistance, KOVILPATTI_CENTER } from '@/lib/road-distance';
import { Step4QuoteView } from './Step4_QuoteView';
import { Loader2 } from 'lucide-react';

export function Step4Quote() {
    const { data } = useWizard();
    const [quote, setQuote] = useState<QuoteResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function compute() {
            setLoading(true);

            const stops = data.deliveryType === 'single'
                ? 1
                : (data.stops?.length || 0) + 1; // +1 for end location

            // Build ordered waypoints: pickup → stops → end/drop
            type LatLng = { lat: number; lng: number };
            const waypoints: LatLng[] = [];

            if (data.pickupLatLng) waypoints.push(data.pickupLatLng);

            if (data.deliveryType === 'multiple') {
                for (const stopLL of (data.stopsLatLng || [])) {
                    if (stopLL) waypoints.push(stopLL);
                }
                if (data.endLatLng) waypoints.push(data.endLatLng);
            } else {
                if (data.dropLatLng) waypoints.push(data.dropLatLng);
            }

            // Fetch road distances in parallel
            const [roadDistance, pickupRadius] = await Promise.all([
                waypoints.length >= 2
                    ? getRoadDistance(waypoints)
                    : Promise.resolve(15), // fallback
                data.pickupLatLng
                    ? getRoadDistance([data.pickupLatLng, KOVILPATTI_CENTER])
                    : Promise.resolve(0),
            ]);

            if (cancelled) return;

            const result = calculateQuote(
                roadDistance,
                pickupRadius,
                stops,
                data.weight,
                data.expectedWaitingHours,
                data.deliveryType
            );

            setQuote(result);
            setLoading(false);
        }

        compute();

        return () => { cancelled = true; };
    }, [data]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-green-50 to-white space-y-5">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-200/20 rounded-full blur-xl animate-pulse" />
                    <Loader2 className="w-14 h-14 text-[var(--primary)] animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-gray-700 font-bold text-lg">Calculating route...</p>
                    <p className="text-gray-400 text-sm">Fetching road distances & pricing</p>
                </div>
            </div>
        );
    }

    if (!quote) return <div>Error calculating quote.</div>;

    return <Step4QuoteView quote={quote} serviceType={data.serviceType} />;
}
