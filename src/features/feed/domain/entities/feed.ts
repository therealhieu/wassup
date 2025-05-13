import { z } from "zod";

export const FeedSchema = z.object({
	title: z.string(),
	feedUrl: z.string(),
	thumbnailUrl: z.string().optional(),
	publishedAt: z.string(),
	description: z.string().optional(),
	categories: z
		.array(z.string())
		.default([])
		.or(z.string().transform((val) => [val])),
	source: z.string(),
	author: z.string().optional(),
});

export type Feed = z.infer<typeof FeedSchema>;
