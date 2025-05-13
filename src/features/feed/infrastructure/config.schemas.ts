import { z } from "zod";

export const FeedWidgetConfigSchema = z.object({
	type: z.literal("feed"),
	urls: z.array(z.string().url()),
	limit: z.number().default(15),
	showTitle: z.boolean().default(true),
	scrollAfterRow: z.number().default(6),
});

export type FeedWidgetConfig = z.infer<typeof FeedWidgetConfigSchema>;
