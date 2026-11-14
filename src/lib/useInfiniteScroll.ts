import { useEffect, useRef } from 'react';

/** Llama a `onReach` cuando el centinela al final de la lista entra en pantalla (scroll infinito). */
export const useInfiniteScroll = (onReach: () => void, enabled: boolean) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onReachRef = useRef(onReach);

  useEffect(() => {
    onReachRef.current = onReach;
  }, [onReach]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !enabled || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) onReachRef.current();
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  return sentinelRef;
};
