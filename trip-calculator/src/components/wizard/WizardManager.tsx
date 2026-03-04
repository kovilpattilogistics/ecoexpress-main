'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

// Define the shape of our wizard state
interface WizardData {
    deliveryType: 'single' | 'multiple' | null;
    serviceType: 'scheduled' | 'dedicated' | 'express';
    pickupLocation: string;
    pickupLatLng: { lat: number; lng: number } | null;
    dropLocation: string; // for single
    dropLatLng: { lat: number; lng: number } | null;
    stops: string[]; // for multiple - intermediate stops
    stopsLatLng: ({ lat: number; lng: number } | null)[]; // lat/lng for each stop
    stopsCount: number;
    endLocation: string; // for multiple
    endLatLng: { lat: number; lng: number } | null;
    weight: number;
    expectedWaitingHours: number;
    productType?: string;
}

interface WizardContextType {
    currentStep: number;
    data: WizardData;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    goToStep: (step: number) => void;
    updateData: (partialData: Partial<WizardData>) => void;
    resetWizard: () => void;
}

const defaultData: WizardData = {
    deliveryType: null,
    serviceType: 'scheduled',
    pickupLocation: 'Kovilpatti Hub',
    pickupLatLng: null,
    dropLocation: '',
    dropLatLng: null,
    stops: [],
    stopsLatLng: [],
    stopsCount: 0,
    endLocation: '',
    endLatLng: null,
    weight: 50,
    expectedWaitingHours: 1,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<WizardData>(defaultData);

    const goToNextStep = useCallback(() => setCurrentStep((prev) => Math.min(prev + 1, 4)), []);
    const goToPreviousStep = useCallback(() => setCurrentStep((prev) => Math.max(prev - 1, 0)), []);
    const goToStep = useCallback((step: number) => setCurrentStep(step), []);

    const updateData = useCallback((partialData: Partial<WizardData>) => {
        setData((prev) => ({ ...prev, ...partialData }));
    }, []);

    const resetWizard = useCallback(() => {
        setData(defaultData);
        setCurrentStep(0);
    }, []);

    const value = useMemo(() => ({
        currentStep,
        data,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        updateData,
        resetWizard,
    }), [currentStep, data, goToNextStep, goToPreviousStep, goToStep, updateData, resetWizard]);

    return (
        <WizardContext.Provider value={value}>
            {children}
        </WizardContext.Provider>
    );
}

export function useWizard() {
    const context = useContext(WizardContext);
    if (context === undefined) {
        throw new Error('useWizard must be used within a WizardProvider');
    }
    return context;
}
