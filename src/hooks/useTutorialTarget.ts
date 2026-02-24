import { useRef, useCallback, useState, useEffect } from 'react';
import { type View, type LayoutRectangle } from 'react-native';

export const useTutorialTarget = (isActive: boolean) => {
  const ref = useRef<View>(null);
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);

  const measure = useCallback(() => {
    if (ref.current) {
      ref.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          setLayout({ x, y, width, height });
        }
      });
    }
  }, []);

  // Poll for measurement when active
  useEffect(() => {
    if (!isActive) return undefined;

    // Initial measurement
    measure();

    // Polling interval to catch layout changes (animations, rotations)
    const interval = setInterval(measure, 500);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, measure]);

  return { ref, layout, measure };
};
