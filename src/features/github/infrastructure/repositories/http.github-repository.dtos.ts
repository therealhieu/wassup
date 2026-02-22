import { z } from "zod";
import {
	GithubRepository,
	GithubRepositorySchema,
} from "../../domain/entities/github-repository";

const RawSearchItemSchema = z.object({
	id: z.number(),
	name: z.string(),
	full_name: z.string(),
	description: z.string().nullable(),
	html_url: z.string(),
	stargazers_count: z.number(),
	forks_count: z.number(),
	language: z.string().nullable(),
	topics: z.array(z.string()).default([]),
	owner: z.object({
		login: z.string(),
		avatar_url: z.string(),
	}),
	created_at: z.string(),
	updated_at: z.string(),
});

export const GithubSearchResponseSchema = z.object({
	total_count: z.number(),
	items: z.array(RawSearchItemSchema),
});

export type GithubSearchResponse = z.infer<typeof GithubSearchResponseSchema>;

export function toGithubRepository(
	raw: z.infer<typeof RawSearchItemSchema>
): GithubRepository {
	const ageInDays = Math.max(
		1,
		(Date.now() - new Date(raw.created_at).getTime()) / (1000 * 60 * 60 * 24)
	);

	return GithubRepositorySchema.parse({
		id: raw.id,
		name: raw.name,
		fullName: raw.full_name,
		description: raw.description,
		url: raw.html_url,
		stars: raw.stargazers_count,
		starsPerDay:
			Math.round((raw.stargazers_count / ageInDays) * 10) / 10,
		forks: raw.forks_count,
		language: raw.language,
		topics: raw.topics,
		owner: {
			login: raw.owner.login,
			avatarUrl: raw.owner.avatar_url,
		},
		createdAt: raw.created_at,
		updatedAt: raw.updated_at,
	});
}
