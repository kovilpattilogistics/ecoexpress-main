'use client';

import React from 'react';
import { Logo } from '@/components/ui/Logo';

export function Header() {
    return (
        <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50 flex items-center justify-center shadow-sm">
            <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="text-lg font-bold text-gray-900 tracking-tight">EcoExpress</span>
            </div>
        </header>
    );
}
