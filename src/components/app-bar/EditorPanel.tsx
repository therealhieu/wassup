"use client";

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	Alert,
	Box,
	TextField,
} from "@mui/material";
import { ConfigEditor } from "./ConfigEditor";
import { useAppConfig } from "@/providers/AppConfigProvider";
import { MonacoProvider } from "@/providers/MonacoProvider";
import * as yaml2 from "yaml";
import { AppConfigSchema } from "@/infrastructure/config.schemas";
import { useState, useEffect } from "react";
import { SchemaDocPanel } from "./SchemaDocPanel";

interface EditorPanelProps {
	open: boolean;
	onClose?: () => void;
}

export function EditorPanel({ open, onClose }: EditorPanelProps) {
	const { config, presets, activePresetId, updatePreset } = useAppConfig();
	const activePreset = presets.find((p) => p.id === activePresetId);
	const [presetName, setPresetName] = useState(activePreset?.name ?? "");
	const [editorValue, setEditorValue] = useState(() => yaml2.stringify(config));
	const [error, setError] = useState<string | null>(null);
	const [hasUserChanges, setHasUserChanges] = useState(false);

	// Reset state when dialog opens
	useEffect(() => {
		if (open) {
			setPresetName(activePreset?.name ?? "");
			setEditorValue(yaml2.stringify(config));
			setHasUserChanges(false);
			setError(null);
		}
	}, [open, config, activePreset?.name]);

	// Sync editor with store changes (e.g. theme toggle) — only if user hasn't started editing
	useEffect(() => {
		if (!hasUserChanges && open) {
			setEditorValue(yaml2.stringify(config));
		}
	}, [config, hasUserChanges, open]);

	const handleEditorChange = (newValue: string) => {
		setEditorValue(newValue);
		setHasUserChanges(true);
	};

	const handleApply = () => {
		try {
			const trimmedName = presetName.trim();
			if (!trimmedName) {
				setError("Preset name cannot be empty");
				return;
			}

			const object = yaml2.parse(editorValue);
			const result = AppConfigSchema.safeParse(object);
			if (!result.success) {
				setError(result.error.issues.map((i) => i.message).join("; "));
				return;
			}

			updatePreset(activePresetId, {
				name: trimmedName,
				config: result.data,
			});

			setHasUserChanges(false);
			setError(null);
			onClose?.();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Invalid YAML");
		}
	};

	const handleClose = () => {
		setHasUserChanges(false);
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
			<MonacoProvider>
				<DialogContent sx={{ flex: 1, p: 2, display: "flex", gap: 2 }}>
					<Box sx={{ width: "50%", display: "flex", flexDirection: "column", gap: 1 }}>
						<TextField
							label="Preset Name"
							value={presetName}
							onChange={(e) => {
								setPresetName(e.target.value);
								setHasUserChanges(true);
							}}
							size="small"
							fullWidth
						/>
						<ConfigEditor
							value={editorValue}
							onChange={handleEditorChange}
						/>
						{error && (
							<Alert severity="error" sx={{ mt: 1 }}>
								{error}
							</Alert>
						)}
					</Box>
					<Box style={{ width: "50%" }}>
						<SchemaDocPanel />
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Box sx={{ flex: 1 }} />
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={handleApply} variant="contained" color="primary">
						Apply
					</Button>
				</DialogActions>
			</MonacoProvider>
		</Dialog>
	);
}
