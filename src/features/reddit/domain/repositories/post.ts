import { z } from "zod";
import { RedditPost } from "../entities/post";
import { Result } from "neverthrow";
import { RedditConfigSchema } from "../../infrastructure/config.schemas";

export const FetchPostParamsSchema = RedditConfigSchema;
export type FetchPostParams = z.infer<typeof FetchPostParamsSchema>;

export interface RedditPostRepository {
	fetchPosts(params: FetchPostParams): Promise<Result<RedditPost[], Error>>;
}
