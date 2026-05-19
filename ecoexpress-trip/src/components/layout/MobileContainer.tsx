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
        <div className="min-h-screen w-full bg-[#E0E0E0] flex justify-center items-start print:!block print:!bg-white print:!m-0 print:!p-0">
            <main
                className={twMerge(
                    clsx(
                        'w-full max-w-[480px] min-h-screen bg-white shadow-xl overflow-hidden relative flex flex-col',
                        'print:!absolute print:!left-0 print:!top-0 print:!w-full print:!max-w-none print:!min-h-0 print:!h-auto print:!shadow-none print:!overflow-visible print:!border-0 print:!m-0 print:!p-0 print:!bg-white',
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
