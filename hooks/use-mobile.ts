import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    const mql = globalThis.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );
    mql.addEventListener('change', onStoreChange);
    return () => mql.removeEventListener('change', onStoreChange);
  }, []);
  const getSnapshot = React.useCallback(
    () => globalThis.innerWidth < MOBILE_BREAKPOINT,
    []
  );
  const getServerSnapshot = React.useCallback(() => false, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
