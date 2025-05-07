import { WidgetConfigSchema } from "@/infrastructure/config.schemas";
import { z } from "zod";

export const TabsWidgetConfigSchema = z
	.object({
		type: z.literal("tabs"),
		labels: z.array(z.string()),
		tabs: z.array(z.lazy(() => WidgetConfigSchema)),
	})
	.refine((data) => data.labels.length === data.tabs.length, {
		message: "Labels and tabs must have the same length",
		path: ["labels", "tabs"],
	});

export type TabsWidgetConfig = z.infer<typeof TabsWidgetConfigSchema>;
