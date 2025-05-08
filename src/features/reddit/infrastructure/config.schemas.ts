import { z } from "zod";

export const RedditWidgetConfigSchema = z.object({
	type: z.literal("reddit"),
	subreddit: z.string(),
	hideTitle: z.boolean().default(false),
	sort: z.enum(["hot", "new", "top", "rising"]),
	limit: z.number().int().positive().max(20).default(5),
});

export type RedditWidgetConfig = z.infer<typeof RedditWidgetConfigSchema>;
