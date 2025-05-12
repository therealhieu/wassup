"use client";

import { Button, Menu, MenuItem } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import { useState, MouseEvent } from "react";
import { signIn } from "@/lib/actions";

export default function SignIn() {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleSignIn = async (provider: string) => {
		await signIn(provider);
		handleClose();
	};

	return (
		<>
			<Button
				onClick={handleClick}
				disableElevation
				color="inherit"
				// sx={{
				// 	backgroundColor: "white",
				// 	color: "text.secondary",
				// 	"&:hover": {
				// 		backgroundColor: "white",
				// 		borderColor: "text.primary",
				// 	},
				// }}
			>
				Sign in
			</Button>
			<Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
				<MenuItem onClick={() => handleSignIn("google")}>
					<GoogleIcon sx={{ mr: 1 }} />
					Sign in with Google
				</MenuItem>
				<MenuItem onClick={() => handleSignIn("github")}>
					<GitHubIcon sx={{ mr: 1 }} />
					Sign in with GitHub
				</MenuItem>
			</Menu>
		</>
	);
}
