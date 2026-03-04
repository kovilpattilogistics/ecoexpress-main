'use client';

import React from 'react';
// 
import { clsx } from 'clsx';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, size = 'md' }: LogoProps) {
    const dimensions = {
        sm: { width: 32, height: 32 },
        md: { width: 48, height: 48 },
        lg: { width: 80, height: 80 },
    };

    const { width, height } = dimensions[size];

    return (
        <div className={clsx("relative flex items-center justify-center", className)} style={{ width, height }}>
            <img
                src="/logo.png"
                alt="EcoExpress"
                className="w-full h-full object-contain"
            />
        </div>
    );
}
