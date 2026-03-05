import React from 'react';
import { WizardProvider } from './src/components/wizard/WizardManager';
import { WizardOrchestrator } from './src/components/wizard/WizardOrchestrator';

function App() {
    return (
        <div className="h-[100dvh] w-full bg-[#E0E0E0] font-sans flex items-center justify-center">
            <div className="w-full h-full max-w-[480px] bg-gray-50 flex flex-col relative shadow-2xl overflow-hidden">
                <WizardProvider>
                    <WizardOrchestrator />
                </WizardProvider>
            </div>
        </div>
    );
}

export default App;
