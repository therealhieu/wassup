"use client";

import { Alert, Snackbar } from "@mui/material";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

export const AuthSnackBar = ({}) => {
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [content, setContent] = useState("");
	const { status } = useSession();

	const handleOpen = () => {
		setSnackbarOpen(true);
		setTimeout(() => {
			setSnackbarOpen(false);
		}, 1000);
	};

	useEffect(() => {
		if (status === "unauthenticated") {
			setContent("Using local mode");
			handleOpen();
		} else if (status === "authenticated") {
			setContent("Using authenticated mode");
			handleOpen();
		}
	}, [status]);

	return (
		<Snackbar
			open={snackbarOpen}
			anchorOrigin={{ vertical: "top", horizontal: "center" }}
		>
			<Alert severity="success" sx={{ width: "100%" }} variant="filled">
				{content}
			</Alert>
		</Snackbar>
	);
};
