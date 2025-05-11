import { z } from "zod";
import { RedditPost } from "../entities/post";
import { Result } from "neverthrow";
import { RedditWidgetConfigSchema } from "../../infrastructure/config.schemas";

export const FetchPostParamsSchema = RedditWidgetConfigSchema;
export type FetchPostParams = z.infer<typeof FetchPostParamsSchema>;

export interface RedditPostRepository {
	fetchMany(params: FetchPostParams): Promise<Result<RedditPost[], Error>>;
}
