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
        <div className="min-h-screen w-full bg-[#E0E0E0] flex justify-center items-start print:bg-white print:block print:p-8">
            <main
                className={twMerge(
                    clsx(
                        'w-full max-w-[480px] min-h-screen bg-white shadow-xl overflow-hidden relative flex flex-col',
                        'print:max-w-none print:w-full print:min-h-0 print:h-auto print:shadow-none print:overflow-visible print:border print:border-gray-300 print:rounded-2xl print:p-8',
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
