'use client';

import React from 'react';
import { useWizard } from '@/components/wizard/WizardManager';
import { Step0Landing } from '@/components/steps/Step0_Landing';
import { Step1TypeSelection } from '@/components/steps/Step1_TypeSelection';
import { Step2Location } from '@/components/steps/Step2_Location';
import { Step3Details } from '@/components/steps/Step3_Details';
import { Step4Quote } from '@/components/steps/Step4_Quote';

export function WizardOrchestrator() {
    const { currentStep } = useWizard();

    switch (currentStep) {
        case 0:
            return <Step0Landing />;
        case 1:
            return <Step1TypeSelection />;
        case 2:
            return <Step2Location />;
        case 3:
            return <Step3Details />;
        case 4:
            return <Step4Quote />;
        default:
            return <Step0Landing />;
    }
}
