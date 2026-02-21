"use client";

import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { useAppConfig } from "@/providers/AppConfigProvider";
import { CssBaseline } from "@mui/material";
import { appThemes } from "@/themes";

export interface AppThemeProviderProps {
	children: React.ReactNode;
}

export const AppTheme = ({ children }: AppThemeProviderProps) => {
	const { config } = useAppConfig();
	const theme = appThemes[config.ui.theme] ?? appThemes.light;

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{children}
		</ThemeProvider>
	);
};
