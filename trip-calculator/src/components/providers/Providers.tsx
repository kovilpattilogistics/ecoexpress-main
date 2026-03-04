'use client';

import React from 'react';
import { WizardProvider } from '@/components/wizard/WizardManager';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WizardProvider>
            {children}
        </WizardProvider>
    );
}
