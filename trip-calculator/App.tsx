import React from 'react';
import { WizardProvider } from './src/components/wizard/WizardManager';
import { WizardOrchestrator } from './src/components/wizard/WizardOrchestrator';

function App() {
    return (
        <WizardProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <WizardOrchestrator />
            </div>
        </WizardProvider>
    );
}

export default App;
