"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "./AppStoreContextProvider";
import { AppConfigSchema } from "@/infrastructure/config.schemas";

export interface AppConfigSseProviderProps {
	children: React.ReactNode;
}

export const AppConfigSseProvider = ({
	children,
}: AppConfigSseProviderProps) => {
	const setAppConfig = useAppStore((state) => state.setAppConfig);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const es = new EventSource("/api/config-sse");

		es.onmessage = es.onmessage = (event: MessageEvent) => {
			try {
				const raw = JSON.parse(event.data);
				const result = AppConfigSchema.safeParse(raw);

				if (result.success) {
					setAppConfig(result.data);
				} else {
					console.error("Invalid config shape", result.error);
				}
			} catch (err: unknown) {
				console.error("Malformed JSON from SSE", err);
				setError(err instanceof Error ? err : new Error(String(err)));
			}
		};

		es.onerror = (err: unknown) => {
			console.error("SSE error:", err);
			setError(err instanceof Error ? err : new Error(String(err)));
		};

		return () => {
			es.close();
		};
	}, [setAppConfig]);

	if (error) {
		return (
			<div
				style={{
					color: "red",
					padding: "1rem",
					margin: "1rem",
					border: "1px solid red",
					borderRadius: "4px",
					backgroundColor: "rgba(255,0,0,0.1)",
				}}
			>
				Config error: {error.message}
			</div>
		);
	}

	return children;
};
