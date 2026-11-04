'use client';

import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
};

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => true,
  resolvedTheme: 'light',
});

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: 'class';
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}

function getSystemTheme(): 'light' | 'dark' {
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getStoredTheme(defaultTheme: Theme, enableSystem: boolean): Theme {
  let storedTheme: string | null;
  try {
    storedTheme = globalThis.localStorage.getItem('theme');
  } catch {
    return defaultTheme;
  }

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }
  if (storedTheme === 'system' && enableSystem) {
    return storedTheme;
  }
  return defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setStoredTheme] = React.useState<Theme>(defaultTheme);

  React.useEffect(() => {
    const storedTheme = getStoredTheme(defaultTheme, enableSystem);
    const timeout = globalThis.setTimeout(() => {
      setStoredTheme(storedTheme);
    }, 0);
    return () => globalThis.clearTimeout(timeout);
  }, [defaultTheme, enableSystem]);

  React.useEffect(() => {
    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const nextTheme =
        theme === 'system' && enableSystem ? getSystemTheme() : theme;
      const resolved = nextTheme === 'dark' ? 'dark' : 'light';

      let transitionStyle: HTMLStyleElement | undefined;
      if (disableTransitionOnChange) {
        transitionStyle = document.createElement('style');
        transitionStyle.textContent =
          '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}';
        document.head.append(transitionStyle);
      }

      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.style.colorScheme = resolved;

      if (transitionStyle) {
        globalThis.getComputedStyle(document.body);
        globalThis.setTimeout(() => transitionStyle?.remove(), 1);
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [disableTransitionOnChange, enableSystem, theme]);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setStoredTheme(nextTheme);
    globalThis.localStorage.setItem('theme', nextTheme);
  }, []);

  const resolvedTheme =
    theme === 'system' && enableSystem && globalThis.window !== undefined
      ? getSystemTheme()
      : theme === 'dark'
        ? 'dark'
        : 'light';

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [resolvedTheme, setTheme, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
