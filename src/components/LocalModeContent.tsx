"use client";

import { AppConfigSchema } from "@/infrastructure/config.schemas";
import React, { useEffect } from "react";
import { useAppStore } from "@/providers/AppStoreContextProvider";
import { BLANK_CONFIG } from "@/lib/constants";
import { STORAGE_NAME } from "@/lib/storage";

export type LocalModeWrapperProps = {
	children: React.ReactNode;
};

export const LocalModeContent = ({ children }: LocalModeWrapperProps) => {
	const setAppConfig = useAppStore((state) => state.setAppConfig);

	useEffect(() => {
		const loadData = async () => {
			const savedConfig = localStorage.getItem(STORAGE_NAME);

			if (savedConfig) {
				try {
					const parsedConfig = AppConfigSchema.parse(
						JSON.parse(savedConfig),
					);
					setAppConfig(parsedConfig);
					return;
				} catch {
					localStorage.removeItem("appConfig");
				}
			}

			const config = BLANK_CONFIG;
			setAppConfig(config);
		};

		loadData().catch((err) =>
			console.error("Failed to load initial data:", err),
		);
	}, [setAppConfig]);

	return children;
};
