"use client";

import { AppBar, Toolbar, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { ThemeMenu } from "./ThemeMenu";
import { RouterMenu } from "./RouterMenu";
import { PresetSelector } from "./PresetSelector";
import { LoginButton } from "@/components/auth/LoginButton";
import { useEditMode } from "@/providers/EditModeProvider";

export const DashboardAppBar = () => {
	const { isEditMode, enterEditMode } = useEditMode();

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
						{!isEditMode && (
							<IconButton
								onClick={enterEditMode}
								color="inherit"
								title="Edit dashboard"
							>
								<EditIcon />
							</IconButton>
						)}
						<LoginButton />
					</div>
				</Toolbar>
			</AppBar>
		</div>
	);
};

