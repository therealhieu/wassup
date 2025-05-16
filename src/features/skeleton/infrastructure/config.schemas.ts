import { z } from "zod";

export const SkeletonWidgetConfigSchema = z.object({
	type: z.literal("skeleton"),
	maxWidth: z.number().min(100).max(1000).default(500),
	maxHeight: z.number().min(100).max(1000).default(500),
	derivedFrom: z.enum([
		"weather",
		"reddit",
		"youtube",
		"feed",
		"tabs",
		"bookmark",
	]),
});

export type SkeletonWidgetConfig = z.infer<typeof SkeletonWidgetConfigSchema>;
