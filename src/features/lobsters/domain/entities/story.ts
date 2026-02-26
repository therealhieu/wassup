import { z } from "zod";

export const LobstersStorySchema = z.object({
	short_id: z.string(),
	title: z.string(),
	url: z.string(),
	score: z.number(),
	submitter_user: z.string(),
	created_at: z.string(),
	comment_count: z.number(),
	comments_url: z.string(),
	tags: z.array(z.string()),
});

export type LobstersStory = z.infer<typeof LobstersStorySchema>;

export const LobstersStoryListSchema = z.array(LobstersStorySchema);
export type LobstersStoryList = z.infer<typeof LobstersStoryListSchema>;
