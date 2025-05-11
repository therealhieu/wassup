import { z } from "zod";

export const YoutubeVideoSchema = z.object({
	id: z.string(),
	title: z.string(),
	url: z.string(),
	authorName: z.string(),
	authorUrl: z.string(),
	thumbnailUrl: z.string(),
	views: z.number(),
	publishedAt: z.string().transform((date) => new Date(date)),
});

export type YoutubeVideo = z.infer<typeof YoutubeVideoSchema>;
