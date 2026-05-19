'use client';

import React, { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardManager';
import { Step0Landing } from '@/components/steps/Step0_Landing';
import { Step1TypeSelection } from '@/components/steps/Step1_TypeSelection';
import { Step2Location } from '@/components/steps/Step2_Location';
import { Step3Details } from '@/components/steps/Step3_Details';
import { Step4Quote } from '@/components/steps/Step4_Quote';
import { DriverTripPage } from '@/components/driver/DriverTripPage';

export function WizardOrchestrator() {
    const { currentStep } = useWizard();
    const [driverMode, setDriverMode] = useState(false);

    // Driver mode overrides the whole wizard
    if (driverMode) {
        return <DriverTripPage onExit={() => setDriverMode(false)} />;
    }

    switch (currentStep) {
        case 0:
            return <Step0Landing onDriverMode={() => setDriverMode(true)} />;
        case 1:
            return <Step1TypeSelection />;
        case 2:
            return <Step2Location />;
        case 3:
            return <Step3Details />;
        case 4:
            return <Step4Quote />;
        default:
            return <Step0Landing onDriverMode={() => setDriverMode(true)} />;
    }
}
