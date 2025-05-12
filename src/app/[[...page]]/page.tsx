"use client";

import { DashboardPage } from "@/components/DashboardPage";
import { PageConfig } from "@/infrastructure/config.schemas";
import { Box, Typography } from "@mui/material";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/providers/AppStoreContextProvider";

export default function CatchAllPage() {
	const pathname = usePathname() || "/";

	const appConfig = useAppStore((state) => state.appConfig);

	const pageConfig = appConfig.ui.pages.find(
		(p: PageConfig) => p.path === pathname
	);

	if (!pageConfig) {
		return (
			<Box p={4}>
				<Typography variant="h4">404 — Page Not Found</Typography>
				<Typography>
					No configuration for path: &quot;{pathname}&quot;
				</Typography>
			</Box>
		);
	}

	return <DashboardPage pageConfig={pageConfig} />;
}
