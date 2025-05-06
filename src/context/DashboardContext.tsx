'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useConfigSSE } from '@/hooks/use-config-sse';
import type { AppConfig } from '@/infrastructure/config/schemas';
import { ThemeProvider } from '@mui/material/styles';
import { appThemes } from '@/themes';
import { CssBaseline } from '@mui/material';

export const THEME_OPTIONS = ['light', 'dark'] as const;
export type ThemeOption = typeof THEME_OPTIONS[number];

export interface DashboardContextType {
    appConfig: AppConfig;
    theme: ThemeOption;
    setTheme: (theme: ThemeOption) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export interface DashboardContextProviderProps {
    children: ReactNode;
    initialConfig: AppConfig;
}

export function DashboardContextProvider({ children, initialConfig }: DashboardContextProviderProps) {
    const [config, error] = useConfigSSE('/api/config-sse', initialConfig);
    const [theme, setTheme] = useState<ThemeOption>(config?.ui.theme || 'light');

    // sync theme when config arrives
    useEffect(() => {
        if (config?.ui.theme) {
            setTheme(config.ui.theme);
        }
    }, [config]);

    if (error) {
        return <div style={{ color: 'red' }}> Config error: {error.message} </div>;
    }
    if (!config) {
        return <div>Loading config…</div>;
    }

    return (
        <DashboardContext.Provider value={{ appConfig: config, theme, setTheme }}>
            <ThemeProvider theme={appThemes[theme]}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </DashboardContext.Provider>
    );
}

export function useDashboardContext() {
    const ctx = useContext(DashboardContext);
    if (!ctx) {
        throw new Error('`useDashboard` must be called within `<DashboardProvider>`');
    }
    return ctx;
}
