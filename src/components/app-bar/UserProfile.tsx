import React, { useState } from "react";
import {
	IconButton,
	Menu,
	MenuItem,
	Avatar,
	Typography,
	Box,
} from "@mui/material";
import { signOut } from "@/lib/actions";

export interface UserProfileProps {
	username?: string;
	avatarUrl?: string;
}

export const UserProfile = ({
	username = "User",
	avatarUrl,
}: UserProfileProps) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleLogout = async () => {
		handleClose();
		// Tell signOut not to perform the redirect itself
		await signOut({ redirect: false });

		// Manually navigate to the root page, forcing a full page load
		window.location.href = "/";
	};

	return (
		<Box>
			<IconButton
				onClick={handleClick}
				size="small"
				data-testid="user-profile-button"
				aria-controls={open ? "user-menu" : undefined}
				aria-haspopup="true"
				aria-expanded={open ? "true" : undefined}
			>
				<Avatar src={avatarUrl} alt={username}>
					{username.charAt(0).toUpperCase()}
				</Avatar>
			</IconButton>
			<Menu
				id="user-menu"
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				transformOrigin={{ horizontal: "right", vertical: "top" }}
				anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			>
				<MenuItem onClick={handleLogout} data-testid="logout-button">
					<Typography>Logout</Typography>
				</MenuItem>
			</Menu>
		</Box>
	);
};

export default UserProfile;
