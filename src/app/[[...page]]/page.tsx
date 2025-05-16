"use client";

import { DashboardPage } from "@/components/DashboardPage";
import { PageConfig } from "@/infrastructure/config.schemas";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/providers/AppStoreContextProvider";

export default function CatchAllPage() {
	const pathname = usePathname() || "/";

	const appConfig = useAppStore((state) => state.appConfig);

	const pageConfig = appConfig.ui.pages.find(
		(p: PageConfig) => p.path === pathname
	);

	return <DashboardPage pageConfig={pageConfig} />;
}
