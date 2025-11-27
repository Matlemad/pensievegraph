import { useEffect, useState } from 'react';

const DESKTOP_BREAKPOINT = 768;

/**
 * Custom hook to detect if the viewport is desktop-sized
 * @returns true if viewport width >= 768px
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    // Check immediately
    checkDesktop();

    // Listen for resize events
    window.addEventListener('resize', checkDesktop);
    
    return () => {
      window.removeEventListener('resize', checkDesktop);
    };
  }, []);

  return isDesktop;
}

