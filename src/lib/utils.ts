import { WidgetConfig } from "@/infrastructure/config.schemas";

export const getDataKey = (config: WidgetConfig): string => {
	return `${config.type}:${JSON.stringify(config)}`;
};
