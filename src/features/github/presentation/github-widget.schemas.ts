import { z } from "zod";
import { GithubWidgetConfigSchema } from "../infrastructure/config.schemas";
import { GithubRepositoryListSchema } from "../domain/entities/github-repository";

export const GithubWidgetInnerPropsSchema = z.object({
	config: GithubWidgetConfigSchema,
	repositories: GithubRepositoryListSchema,
});

export type GithubWidgetInnerProps = z.infer<
	typeof GithubWidgetInnerPropsSchema
>;
