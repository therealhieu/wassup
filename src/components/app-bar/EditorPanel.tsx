"use client";

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	Alert,
	Box,
} from "@mui/material";
import { ConfigEditor } from "./ConfigEditor";
import { useAppStore } from "@/providers/AppStoreContextProvider";
import * as yaml2 from "yaml";
import { AppConfigSchema } from "@/infrastructure/config.schemas";
import { useState } from "react";
import { GuidesPanel } from "./GuidesPanel";

interface EditorPanelProps {
	open: boolean;
	onClose?: () => void;
}

export function EditorPanel({ open, onClose }: EditorPanelProps) {
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
			maxWidth="xl"
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
			<DialogContent sx={{ flex: 1, p: 2, display: "flex", gap: 2 }}>
				<Box sx={{ width: "50%" }}>
					<ConfigEditor
						value={editorValue}
						onChange={setEditorValue}
					/>
					{error && (
						<Alert severity="error" sx={{ mt: 2 }}>
							{error}
						</Alert>
					)}
				</Box>
				<Box style={{ width: "50%" }}>
					<GuidesPanel open={true} />
				</Box>
			</DialogContent>
			<DialogActions sx={{ p: 2 }}>
				<Box sx={{ flex: 1 }} />
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
