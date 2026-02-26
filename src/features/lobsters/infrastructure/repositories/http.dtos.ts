import { z } from "zod";
import {
	LobstersStory,
	LobstersStorySchema,
} from "../../domain/entities/story";

export const LobstersApiItemSchema = z
	.object({
		short_id: z.string(),
		title: z.string(),
		url: z.string().default(""),
		score: z.number(),
		submitter_user: z.string(),
		created_at: z.string(),
		comment_count: z.number(),
		comments_url: z.string(),
		tags: z.array(z.string()),
	})
	.passthrough();

export type LobstersApiItem = z.infer<typeof LobstersApiItemSchema>;

export const LobstersApiResponseSchema = z.array(LobstersApiItemSchema);

export function mapApiItemToStory(item: LobstersApiItem): LobstersStory {
	return LobstersStorySchema.parse({
		short_id: item.short_id,
		title: item.title,
		url: item.url || item.comments_url,
		score: item.score,
		submitter_user: item.submitter_user,
		created_at: item.created_at,
		comment_count: item.comment_count,
		comments_url: item.comments_url,
		tags: item.tags,
	});
}
