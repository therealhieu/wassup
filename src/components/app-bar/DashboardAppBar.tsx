"use client";

import { AppBar, Toolbar } from "@mui/material";
import { ThemeMenu } from "./ThemeMenu";
import { RouterMenu } from "./RouterMenu";
import { OpenConfigEditorButton } from "./OpenConfigEditorButton";
import { PresetSelector } from "./PresetSelector";
import { LoginButton } from "@/components/auth/LoginButton";

export const DashboardAppBar = () => {
	return (
		<div
			style={{
				maxWidth: "800px",
				margin: "0 auto",
				padding: "8px 16px 0",
			}}
		>
			<AppBar
				position="static"
				sx={{
					mb: 2,
					borderRadius: "16px",
					bgcolor: "background.default",
					color: "text.primary",
				}}
			>
				<Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
					<RouterMenu />
					<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
						<PresetSelector />
						<ThemeMenu />
						<OpenConfigEditorButton />
						<LoginButton />
					</div>
				</Toolbar>
			</AppBar>
		</div>
	);
};

