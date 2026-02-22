import { GithubRepository } from "../../domain/entities/github-repository";
import { GithubRepositoryRepository } from "../../domain/repositories/github-repository";
import { GithubWidgetConfig } from "../config.schemas";
import {
	GithubSearchResponseSchema,
	toGithubRepository,
} from "./http.github-repository.dtos";

export class HttpGithubRepositoryRepository
	implements GithubRepositoryRepository
{
	private readonly BASE_URL =
		"https://api.github.com/search/repositories";

	private get token(): string | undefined {
		return process.env.GITHUB_TOKEN;
	}

	private get headers(): HeadersInit {
		const h: HeadersInit = {
			Accept: "application/vnd.github.v3+json",
		};
		if (this.token) {
			h["Authorization"] = `Bearer ${this.token}`;
		}
		return h;
	}

	public async search(
		config: GithubWidgetConfig
	): Promise<GithubRepository[]> {
		const since = config.createdAfter;
		const topics = config.topics ?? [];

		if (topics.length > 1) {
			const perTopicLimit = Math.ceil(config.limit / topics.length) + 5;
			const results = await Promise.allSettled(
				topics.map((topic) =>
					this.searchRepositories(since, config.createdBefore, config.language, topic, perTopicLimit, config.minStars, config.maxStars)
				)
			);

			const repoMap = new Map<number, GithubRepository>();
			for (const result of results) {
				if (result.status === "fulfilled") {
					for (const repo of result.value) {
						if (!repoMap.has(repo.id)) {
							repoMap.set(repo.id, repo);
						}
					}
				}
			}

			return [...repoMap.values()]
				.sort((a, b) => b.stars - a.stars)
				.slice(0, config.limit);
		}

		return this.searchRepositories(
			since,
			config.createdBefore,
			config.language,
			topics[0],
			config.limit,
			config.minStars,
			config.maxStars
		);
	}

	public async enrichWithRecentStars(
		repos: GithubRepository[],
		dateRange: string
	): Promise<GithubRepository[]> {
		if (!this.token) return repos;

		const days = this.getDaysFromRange(dateRange);
		const cloned = repos.map((r) => ({ ...r, owner: { ...r.owner } }));

		// Check rate limit before expensive enrichment
		const remaining = await this.getRateLimitRemaining();
		if (remaining !== null && remaining < cloned.length * 2) {
			console.warn(
				`GitHub rate limit low (${remaining} remaining), skipping stargazer enrichment`
			);
			return cloned;
		}

		await Promise.allSettled(
			cloned.map(async (repo) => {
				repo.recentStars = await this.fetchRecentStarCount(
					repo.fullName,
					days
				);
			})
		);

		return cloned;
	}

	private async searchRepositories(
		since: string,
		until: string | undefined,
		language: string | undefined,
		topic: string | undefined,
		limit: number,
		minStars?: number,
		maxStars?: number
	): Promise<GithubRepository[]> {
		const createdQ = until ? `created:${since}..${until}` : `created:>${since}`;
		const parts: string[] = [createdQ];
		if (language) parts.push(`language:${language}`);
		if (topic) parts.push(`topic:${topic}`);
		if (minStars !== undefined && maxStars !== undefined) {
			parts.push(`stars:${minStars}..${maxStars}`);
		} else if (minStars !== undefined) {
			parts.push(`stars:>=${minStars}`);
		} else if (maxStars !== undefined) {
			parts.push(`stars:<=${maxStars}`);
		}

		const query = parts.join(" ");
		const perPage = Math.min(limit, 100);
		const maxPages = 3;
		const repos: GithubRepository[] = [];

		for (let page = 1; page <= maxPages; page++) {
			const url = `${this.BASE_URL}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}&page=${page}`;
			const response = await fetch(url, { headers: this.headers });
			if (!response.ok) {
				throw new Error(
					`GitHub fetch failed: ${response.status} ${response.statusText}`
				);
			}

			const json = await response.json();
			const parsed = GithubSearchResponseSchema.parse(json);
			repos.push(...parsed.items.map(toGithubRepository));

			// Stop if we have enough or no more results
			if (repos.length >= limit || repos.length >= parsed.total_count) {
				break;
			}
		}

		return repos.slice(0, limit);
	}

	/**
	 * Walks backwards through stargazer pages to count recent stars.
	 * Stops when it finds stargazers older than the cutoff or hits maxPages.
	 */
	private async fetchRecentStarCount(
		fullName: string,
		days: number
	): Promise<number> {
		const perPage = 100;
		const maxPages = 5;
		const starHeaders = {
			...this.headers,
			Accept: "application/vnd.github.star+json",
		};
		const url = `https://api.github.com/repos/${fullName}/stargazers`;

		const firstRes = await fetch(
			`${url}?per_page=${perPage}`,
			{ headers: starHeaders }
		);
		if (!firstRes.ok) return 0;

		const linkHeader = firstRes.headers.get("Link");
		const lastPage = this.parseLastPage(linkHeader) ?? 1;

		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - days);

		if (lastPage <= 1) {
			const stargazers: { starred_at: string }[] = await firstRes.json();
			return stargazers.filter(
				(s) => new Date(s.starred_at) >= cutoff
			).length;
		}

		let totalRecent = 0;
		const endPage = Math.max(1, lastPage - maxPages + 1);

		for (let page = lastPage; page >= endPage; page--) {
			const res = await fetch(
				`${url}?per_page=${perPage}&page=${page}`,
				{ headers: starHeaders }
			);
			if (!res.ok) break;

			const stargazers: { starred_at: string }[] = await res.json();
			const recent = stargazers.filter(
				(s) => new Date(s.starred_at) >= cutoff
			);
			totalRecent += recent.length;

			if (recent.length < stargazers.length) break;
		}

		return totalRecent;
	}

	private async getRateLimitRemaining(): Promise<number | null> {
		try {
			const res = await fetch("https://api.github.com/rate_limit", {
				headers: this.headers,
			});
			if (!res.ok) return null;
			const data = await res.json();
			return data?.rate?.remaining ?? null;
		} catch {
			return null;
		}
	}

	private parseLastPage(linkHeader: string | null): number | null {
		if (!linkHeader) return null;
		const match = linkHeader.match(/page=(\d+)>;\s*rel="last"/);
		return match ? parseInt(match[1], 10) : null;
	}

	private getDaysFromRange(range: string): number {
		switch (range) {
			case "7d":
				return 7;
			case "30d":
				return 30;
			default:
				return 90;
		}
	}
}
