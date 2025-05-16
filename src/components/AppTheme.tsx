"use client";

import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { useAppStore } from "@/providers/AppStoreContextProvider";
import { CssBaseline } from "@mui/material";
import { appThemes } from "@/themes";

export interface AppThemeProviderProps {
	children: React.ReactNode;
}

export const AppTheme = ({ children }: AppThemeProviderProps) => {
	const theme = useAppStore((state) => {
		const current = state.appConfig.ui.theme;

		if (!current) {
			return appThemes.light;
		}

		return appThemes[current];
	});

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{children}
		</ThemeProvider>
	);
};
