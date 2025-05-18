"use client";

import { IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useState } from "react";
import { ConfigPanel } from "./ConfigPanel";

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
			<ConfigPanel open={open} onClose={() => setOpen(false)} />
		</>
	);
};
