import { z } from "zod";

export const DevtoArticleSchema = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string(),
	url: z.string(),
	published_timestamp: z.string(),
	positive_reactions_count: z.number(),
	comments_count: z.number(),
	reading_time_minutes: z.number(),
	tag_list: z.array(z.string()),
	user_name: z.string(),
	user_username: z.string(),
});

export type DevtoArticle = z.infer<typeof DevtoArticleSchema>;

export const DevtoArticleListSchema = z.array(DevtoArticleSchema);
export type DevtoArticleList = z.infer<typeof DevtoArticleListSchema>;
