import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface MobileContainerProps {
    children: React.ReactNode;
    className?: string;
}

import { Header } from './Header';

export function MobileContainer({ children, className }: MobileContainerProps) {
    return (
        <div className="min-h-screen w-full bg-[#E0E0E0] flex justify-center items-start mobile-container-wrapper">
            <main
                id="mobile-container-main"
                className={twMerge(
                    clsx(
                        'w-full max-w-[480px] min-h-screen bg-white shadow-xl overflow-hidden relative flex flex-col',
                        className
                    )
                )}
            >
                <div className="print:hidden">
                    <Header />
                </div>
                {children}
            </main>
        </div>
    );
}
