"use client";

import { useAppConfig } from "@/providers/AppConfigProvider";
import { Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export const RouterMenu = () => {
	const router = useRouter();
	const { config } = useAppConfig();

	return (
		<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
			<Typography variant="h6">Wassup</Typography>
			{config.ui.pages.map((page) => (
				<Button
					key={page.path}
					color="inherit"
					onClick={() => router.push(page.path)}
				>
					{page.title}
				</Button>
			))}
		</div>
	);
};
