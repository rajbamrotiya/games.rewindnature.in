import { useState, useEffect, useRef } from 'react';

export function useFullscreen<T extends HTMLElement = HTMLDivElement>() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const elementRef = useRef<T>(null);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === elementRef.current || document.fullscreenElement === document.documentElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            const target = elementRef.current || document.documentElement;
            target.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return { isFullscreen, toggleFullscreen, elementRef };
}
