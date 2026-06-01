import { useEffect } from 'react';

export function useModalCloser(cleanupFn) {
  useEffect(() => {
    const handler = () => cleanupFn();
    window.addEventListener('oaq:close-modals', handler);
    return () => window.removeEventListener('oaq:close-modals', handler);
  }, [cleanupFn]);
}