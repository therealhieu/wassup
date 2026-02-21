"use client";

import { DashboardPage } from "@/components/DashboardPage";
import { PageConfig } from "@/infrastructure/config.schemas";
import { usePathname } from "next/navigation";
import { useAppConfig } from "@/providers/AppConfigProvider";

export default function CatchAllPage() {
	const pathname = usePathname() || "/";
	const { config } = useAppConfig();

	const pageConfig = config.ui.pages.find(
		(p: PageConfig) => p.path === pathname
	);

	return <DashboardPage pageConfig={pageConfig} />;
}
