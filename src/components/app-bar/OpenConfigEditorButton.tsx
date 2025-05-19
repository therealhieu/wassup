"use client";

import { IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useState } from "react";
import { EditorPanel } from "./EditorPanel";

export const OpenConfigEditorButton = () => {
	const [open, setOpen] = useState(false);

	return (
		<>
			<IconButton
				aria-label="Open config editor"
				sx={{
					color: "text.primary",
				}}
				onClick={() => setOpen(true)}
			>
				<SettingsIcon />
			</IconButton>
			<EditorPanel open={open} onClose={() => setOpen(false)} />
		</>
	);
};
