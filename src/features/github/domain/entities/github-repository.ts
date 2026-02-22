import { z } from "zod";

export const GithubRepositorySchema = z.object({
	id: z.number(),
	name: z.string(),
	fullName: z.string(),
	description: z.string().nullable(),
	url: z.string().url(),
	stars: z.number(),
	starsPerDay: z.number(),
	recentStars: z.number().optional(),
	forks: z.number(),
	language: z.string().nullable(),
	topics: z.array(z.string()).default([]),
	owner: z.object({
		login: z.string(),
		avatarUrl: z.string().url(),
	}),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type GithubRepository = z.infer<typeof GithubRepositorySchema>;

export const GithubRepositoryListSchema = z.array(GithubRepositorySchema);
export type GithubRepositoryList = z.infer<typeof GithubRepositoryListSchema>;
