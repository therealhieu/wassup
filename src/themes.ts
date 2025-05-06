'use client';

import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
    typography: {
        fontFamily: 'var(--font-roboto)',
    },
    palette: {
        mode: 'light',
    },
});

export const darkTheme = createTheme({
    typography: {
        fontFamily: 'var(--font-roboto)',
    },
    palette: {
        mode: 'dark',
    },
});

export const appThemes = {
    light: lightTheme,
    dark: darkTheme,
};

