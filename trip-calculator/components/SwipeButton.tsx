import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface SwipeButtonProps {
    onConfirm: () => void;
    text: string;
    color?: string; // Tailwind color class prefix e.g. 'bg-green-500'
    disabled?: boolean;
    resetAfter?: number; // ms to reset after confirm
}

export const SwipeButton: React.FC<SwipeButtonProps> = ({
    onConfirm,
    text,
    color = 'bg-primary',
    disabled = false,
    resetAfter = 2000
}) => {
    const [dragWidth, setDragWidth] = useState(0);
    const [confirmed, setConfirmed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);

    const handleStart = (clientX: number) => {
        if (disabled || confirmed) return;
        isDragging.current = true;
        startX.current = clientX;
    };

    const handleMove = (clientX: number) => {
        if (!isDragging.current || !containerRef.current || confirmed) return;
        const containerWidth = containerRef.current.clientWidth;
        const maxDrag = containerWidth - 56; // 56px is handle width roughly

        let delta = clientX - startX.current;
        if (delta < 0) delta = 0;
        if (delta > maxDrag) delta = maxDrag;

        setDragWidth(delta);

        if (delta >= maxDrag * 0.95) {
            handleConfirm();
        }
    };

    const handleEnd = () => {
        isDragging.current = false;
        if (!confirmed) {
            setDragWidth(0);
        }
    };

    const handleConfirm = () => {
        isDragging.current = false;
        setConfirmed(true);
        setDragWidth(containerRef.current ? containerRef.current.clientWidth - 56 : 0);
        onConfirm();

        if (resetAfter > 0) {
            setTimeout(() => {
                setConfirmed(false);
                setDragWidth(0);
            }, resetAfter);
        }
    };

    // Mouse Events
    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
    const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();

    // Touch Events
    const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
    const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();

    useEffect(() => {
        if (isDragging.current) {
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchend', handleEnd);
        }
        return () => {
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchend', handleEnd);
        }
    }, [isDragging.current]);

    const bgColor = confirmed ? 'bg-green-600' : 'bg-gray-200';
    const handleColor = confirmed ? 'bg-white' : color;
    const textColor = confirmed ? 'text-white' : 'text-gray-500';

    return (
        <div
            className={`relative h-14 rounded-full overflow-hidden select-none ${bgColor} transition-colors duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            ref={containerRef}
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
            onMouseUp={onMouseUp} // Fallback
        >
            {/* Background Text */}
            <div className={`absolute inset-0 flex items-center justify-center font-bold text-sm uppercase tracking-wider ${textColor}`}>
                {confirmed ? 'Confirmed!' : text}
            </div>

            {/* Draggable Handle */}
            <div
                className={`absolute top-1 left-1 bottom-1 w-12 rounded-full shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing z-10 ${handleColor} transition-transform duration-75 ease-linear`}
                style={{ transform: `translateX(${dragWidth}px)` }}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            >
                {confirmed ? (
                    <Check className={`w-6 h-6 ${color === 'bg-white' ? 'text-green-600' : 'text-primary'}`} />
                ) : (
                    <ArrowRight className="w-6 h-6 text-white" />
                )}
            </div>
        </div>
    );
};
