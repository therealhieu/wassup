import { z } from "zod";
import {
	HackerNewsStory,
	HackerNewsStorySchema,
} from "../../domain/entities/story";

// ── Firebase /item/{id}.json ────────────────────────────────────────

export const FirebaseItemDtoSchema = z
	.object({
		id: z.number(),
		title: z.string().optional(),
		url: z.string().optional(),
		score: z.number().optional(),
		by: z.string().optional(),
		time: z.number().optional(),
		descendants: z.number().optional(),
		type: z.string().optional(),
	})
	.passthrough();

export type FirebaseItemDto = z.infer<typeof FirebaseItemDtoSchema>;

export function mapFirebaseItemToStory(
	item: FirebaseItemDto
): HackerNewsStory {
	return HackerNewsStorySchema.parse({
		id: item.id,
		title: item.title ?? "",
		url: item.url,
		score: item.score ?? 0,
		by: item.by ?? "",
		time: item.time ?? 0,
		descendants: item.descendants ?? 0,
	});
}

// ── Algolia /search response ────────────────────────────────────────

export const AlgoliaHitDtoSchema = z.object({
	objectID: z.string(),
	title: z.string(),
	url: z.string().nullable().optional(),
	points: z.number().nullable(),
	author: z.string(),
	created_at_i: z.number(),
	num_comments: z.number().nullable(),
});

export type AlgoliaHitDto = z.infer<typeof AlgoliaHitDtoSchema>;

export const AlgoliaSearchResponseSchema = z.object({
	hits: z.array(AlgoliaHitDtoSchema),
});

export type AlgoliaSearchResponse = z.infer<
	typeof AlgoliaSearchResponseSchema
>;

export function mapAlgoliaHitToStory(hit: AlgoliaHitDto): HackerNewsStory {
	return HackerNewsStorySchema.parse({
		id: Number(hit.objectID),
		title: hit.title,
		url: hit.url ?? undefined,
		score: hit.points ?? 0,
		by: hit.author,
		time: hit.created_at_i,
		descendants: hit.num_comments ?? 0,
	});
}
