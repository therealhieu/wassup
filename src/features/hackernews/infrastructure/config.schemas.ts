import { z } from "zod";

export const HackerNewsWidgetConfigSchema = z.object({
	type: z.literal("hackernews"),
	sort: z.enum(["top", "best", "new", "ask", "show"]).default("top"),
	limit: z.number().int().positive().max(30).default(10),
	query: z.string().optional(),
	hideTitle: z.boolean().default(false),
});

export type HackerNewsWidgetConfig = z.infer<
	typeof HackerNewsWidgetConfigSchema
>;
