import { z } from "zod";
import { RedditPost, RedditPostSchema } from "../../domain/entities/post";
import { Z } from "zod-class";

export const SubredditResponseSchema = z.object({
	kind: z.literal("Listing"),
	data: z.object({
		children: z.array(
			z.object({
				kind: z.literal("t3"),
				data: RedditPostSchema,
			})
		),
	}),
});

export class SubredditResponse extends Z.class(SubredditResponseSchema.shape) {
	public getPosts(): RedditPost[] {
		return this.data.children.map((child) =>
			RedditPostSchema.parse(child.data)
		);
	}
}
