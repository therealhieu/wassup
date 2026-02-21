import { z } from "zod";
import { RedditPost } from "../entities/post";
import { RedditWidgetConfigSchema } from "../../infrastructure/config.schemas";

export const FetchPostParamsSchema = RedditWidgetConfigSchema;
export type FetchPostParams = z.infer<typeof FetchPostParamsSchema>;

export interface RedditPostRepository {
	fetchMany(params: FetchPostParams): Promise<RedditPost[]>;
}
