"use client";

import { AppBar, Toolbar } from "@mui/material";
import { ThemeMenu } from "./ThemeMenu";
import { z } from "zod";
import SignInButton from "./SignInButton";
import { useSession } from "next-auth/react";
import UserProfile from "./UserProfile";
import { RouterMenu } from "./RouterMenu";
import { OpenConfigEditorButton } from "./OpenConfigEditorButton";

export const PageInfoSchema = z.object({
	title: z.string(),
	path: z.string(),
});

export type PageInfo = z.infer<typeof PageInfoSchema>;

export const DashboardAppBar = () => {
	const { data: session, status } = useSession();
	const { name, image } = session?.user || {};

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
				<Toolbar
					sx={{ display: "flex", justifyContent: "space-between" }}
				>
					<RouterMenu />
					<div style={{ display: "flex", gap: "0.5rem" }}>
						<ThemeMenu />
						<OpenConfigEditorButton />
						{(() => {
							switch (status) {
								case "loading":
									return null;
								case "unauthenticated":
									return <SignInButton />;
								case "authenticated":
									return (
										<UserProfile
											username={name || ""}
											avatarUrl={image || ""}
										/>
									);
								default:
									return null;
							}
						})()}
					</div>
				</Toolbar>
			</AppBar>
		</div>
	);
};
