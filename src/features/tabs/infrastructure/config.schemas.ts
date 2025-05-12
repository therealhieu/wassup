import { WidgetConfig, WidgetConfigSchema } from "@/infrastructure/config.schemas";
import { z, ZodType } from "zod";

export const TabsWidgetConfigSchema = z
	.object({
		type: z.literal("tabs"),
		labels: z.array(z.string()),
		tabs: z.array(z.lazy(() => WidgetConfigSchema)),
	}).
	refine((data) => data.labels.length === data.tabs.length, {
		message: "Labels and tabs must have the same length",
		path: ["labels", "tabs"],
	}) as ZodType;

export type TabsWidgetConfig = {
	type: "tabs";
	labels: string[];
	tabs: WidgetConfig[];
}


