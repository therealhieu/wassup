import { z } from "zod";
import { HackerNewsStory } from "../entities/story";
import { HackerNewsWidgetConfigSchema } from "../../infrastructure/config.schemas";

export const FetchStoryParamsSchema = HackerNewsWidgetConfigSchema;
export type FetchStoryParams = z.infer<typeof FetchStoryParamsSchema>;

export interface HackerNewsStoryRepository {
	fetchMany(params: FetchStoryParams): Promise<HackerNewsStory[]>;
}
