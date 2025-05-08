import { z } from "zod";

export const RedditPostSchema = z.object({
	id: z.string(),
	title: z.string(),
	author: z.string(),
	subreddit: z.string(),
	selftext: z.string().optional(),
	url: z.string().url(),
	permalink: z.string(),
	score: z.number().int(),
	upvoteRatio: z.number(),
	numComments: z.number().int(),
	created: z.number(),
	thumbnail: z.string().optional(),
	isVideo: z.boolean().default(false),
	isNSFW: z.boolean().default(false),
	isSpoiler: z.boolean().default(false),
	isLocked: z.boolean().default(false),
	isPinned: z.boolean().default(false),
});

export type RedditPost = z.infer<typeof RedditPostSchema>;

export const RedditPostListSchema = z.array(RedditPostSchema);
export type RedditPostList = z.infer<typeof RedditPostListSchema>;
