import { z } from "zod";

export const HackerNewsStorySchema = z.object({
	id: z.number(),
	title: z.string(),
	url: z.string().optional(),
	score: z.number(),
	by: z.string(),
	time: z.number(),
	descendants: z.number().default(0),
});

export type HackerNewsStory = z.infer<typeof HackerNewsStorySchema>;

export const HackerNewsStoryListSchema = z.array(HackerNewsStorySchema);
export type HackerNewsStoryList = z.infer<typeof HackerNewsStoryListSchema>;
