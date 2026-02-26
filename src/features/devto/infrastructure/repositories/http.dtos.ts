import { z } from "zod";
import { DevtoArticle, DevtoArticleSchema } from "../../domain/entities/article";

export const DevtoApiItemSchema = z
	.object({
		id: z.number(),
		title: z.string(),
		description: z.string().default(""),
		url: z.string(),
		published_timestamp: z.string(),
		positive_reactions_count: z.number(),
		comments_count: z.number(),
		reading_time_minutes: z.number(),
		tag_list: z
			.union([z.array(z.string()), z.string()])
			.transform((val) =>
				typeof val === "string"
					? val
							.split(", ")
							.map((t) => t.trim())
							.filter(Boolean)
					: val,
			),
		user: z.object({
			name: z.string(),
			username: z.string(),
		}),
	})
	.passthrough();

export type DevtoApiItem = z.infer<typeof DevtoApiItemSchema>;

export const DevtoApiResponseSchema = z.array(DevtoApiItemSchema);

export function mapApiItemToArticle(item: DevtoApiItem): DevtoArticle {
	return DevtoArticleSchema.parse({
		id: item.id,
		title: item.title,
		description: item.description,
		url: item.url,
		published_timestamp: item.published_timestamp,
		positive_reactions_count: item.positive_reactions_count,
		comments_count: item.comments_count,
		reading_time_minutes: item.reading_time_minutes,
		tag_list: item.tag_list,
		user_name: item.user.name,
		user_username: item.user.username,
	});
}
