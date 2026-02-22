import { z } from "zod";

export const GithubSortConfigSchema = z.object({
	field: z
		.enum(["stars", "velocity", "forks", "createdAt"])
		.default("velocity"),
	direction: z.enum(["asc", "desc"]).default("desc"),
});

export const GithubWidgetConfigSchema = z.object({
	type: z.literal("github"),
	language: z.string().optional(),
	topics: z.array(z.string()).optional(),
	createdAfter: z.string().default("2024-01-01"),
	createdBefore: z.string().optional(),
	dateRange: z.enum(["7d", "30d", "90d"]).default("90d"),
	limit: z.number().int().positive().max(50).default(25),
	minStars: z.number().int().nonnegative().optional(),
	maxStars: z.number().int().positive().optional(),
	sort: GithubSortConfigSchema.default({
		field: "velocity",
		direction: "desc",
	}),
});

export type GithubWidgetConfig = z.infer<typeof GithubWidgetConfigSchema>;
