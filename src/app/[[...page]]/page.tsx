"use client";

import { DashboardPage } from "@/components/DashboardPage";
import { EditModeContainer } from "@/components/config-editor/EditModeContainer";
import { PageConfig } from "@/infrastructure/config.schemas";
import { usePathname } from "next/navigation";
import { useAppConfig } from "@/providers/AppConfigProvider";
import { useEditMode } from "@/providers/EditModeProvider";

export default function CatchAllPage() {
	const pathname = usePathname() || "/";
	const { config } = useAppConfig();
	const { isEditMode, exitEditMode } = useEditMode();

	if (isEditMode) {
		return (
			<div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}>
				<EditModeContainer onExitEditMode={exitEditMode} initialPath={pathname} />
			</div>
		);
	}

	const pageConfig = config.ui.pages.find(
		(p: PageConfig) => p.path === pathname,
	);

	return <DashboardPage pageConfig={pageConfig} />;
}
