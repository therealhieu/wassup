"use client";

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	Alert,
} from "@mui/material";
import { ConfigEditor } from "./ConfigEditor";
import { useAppStore } from "@/providers/AppStoreContextProvider";
import * as yaml2 from "yaml";
import { AppConfigSchema } from "@/infrastructure/config.schemas";
import { useState } from "react";

interface ConfigPanelProps {
	open: boolean;
	onClose?: () => void;
}

export function ConfigPanel({ open, onClose }: ConfigPanelProps) {
	const appConfig = useAppStore((state) => state.appConfig);
	const setAppConfig = useAppStore((state) => state.setAppConfig);
	const [editorValue, setEditorValue] = useState(yaml2.stringify(appConfig));
	const [error, setError] = useState<string | null>(null);

	const handleApply = () => {
		try {
			const object = yaml2.parse(editorValue);
			const config = AppConfigSchema.parse(object);
			setAppConfig(config);
			setError(null);
			onClose?.();
		} catch (error) {
			console.error("Failed to parse config:", error);
			setError(
				error instanceof Error
					? error.message
					: "Invalid configuration",
			);
		}
	};

	return (
		<Dialog
			open={open}
			maxWidth="md"
			fullWidth
			onClose={onClose}
			slotProps={{
				backdrop: {
					style: {
						backgroundColor: "rgba(0, 0, 0, 0.5)",
					},
				},
			}}
		>
			<DialogContent sx={{ flex: 1, p: 2 }}>
				<ConfigEditor value={editorValue} onChange={setEditorValue} />
				{error && (
					<Alert severity="error" sx={{ mt: 2 }}>
						{error}
					</Alert>
				)}
			</DialogContent>
			<DialogActions sx={{ p: 2 }}>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					onClick={handleApply}
					variant="contained"
					color="primary"
				>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}
