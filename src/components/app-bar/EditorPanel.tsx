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
import { useState, useEffect } from "react";
import { GuidesPanel } from "./GuidesPanel";

interface EditorPanelProps {
	open: boolean;
	onClose?: () => void;
}

export function EditorPanel({ open, onClose }: EditorPanelProps) {
	const appConfig = useAppStore((state) => state.appConfig);
	const setAppConfig = useAppStore((state) => state.setAppConfig);
	const [editorValue, setEditorValue] = useState(() =>
		yaml2.stringify(appConfig),
	);
	const [error, setError] = useState<string | null>(null);
	const [hasUserChanges, setHasUserChanges] = useState(false);

	// Reset state when dialog opens
	useEffect(() => {
		if (open) {
			const newYaml = yaml2.stringify(appConfig);
			setEditorValue(newYaml);
			setHasUserChanges(false);
			setError(null);
		}
	}, [open, appConfig]);

	// Sync editor value with store config changes (e.g., after rehydration from localStorage)
	// Only sync if user hasn't made manual changes to avoid overwriting their work
	useEffect(() => {
		if (!hasUserChanges && open) {
			const newYaml = yaml2.stringify(appConfig);
			setEditorValue(newYaml);
		}
	}, [appConfig, hasUserChanges, open]);

	const handleEditorChange = (newValue: string) => {
		setEditorValue(newValue);
		setHasUserChanges(true);
	};

	const handleApply = () => {
		try {
			const object = yaml2.parse(editorValue);
			const config = AppConfigSchema.parse(object);
			console.log("📝 EditorPanel: Applying config change", { 
				configPreview: JSON.stringify(config).substring(0, 200) + '...',
				hasPages: config.ui.pages.length 
			});
			setAppConfig(config);
			setHasUserChanges(false); // Reset flag after successful apply
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

	const handleClose = () => {
		setHasUserChanges(false); // Reset flag when closing without applying
		onClose?.();
	};

	return (
		<Dialog
			open={open}
			maxWidth="xl"
			fullWidth
			onClose={handleClose}
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
						onChange={handleEditorChange}
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
				<Button onClick={handleClose}>Cancel</Button>
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
