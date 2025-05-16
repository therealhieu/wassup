import { WidgetConfig } from "@/infrastructure/config.schemas";
import { AppConfig } from "@/infrastructure/config.schemas";
import { SkeletonWidgetConfig } from "@/features/skeleton/infrastructure/config.schemas";

export const getDataKey = (config: WidgetConfig): string => {
	return `${config.type}:${JSON.stringify(config)}`;
};

export const toSkeletonConfig = (config: AppConfig): AppConfig => {
	return {
		...config,
		ui: {
			...config.ui,
			pages: config.ui.pages.map((page) => ({
				...page,
				columns: page.columns.map((column) => ({
					...column,
					widgets: column.widgets.map(
						(widget) =>
							({
								type: "skeleton",
								derivedFrom: widget.type,
							} as SkeletonWidgetConfig)
					),
				})),
			})),
		},
	};
};
