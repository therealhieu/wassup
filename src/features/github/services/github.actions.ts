"use server";

import { GithubRepository } from "../domain/entities/github-repository";
import { GithubWidgetConfig } from "../infrastructure/config.schemas";
import {
	GithubWidgetInnerProps,
	GithubWidgetInnerPropsSchema,
} from "../presentation/github-widget.schemas";
import { HttpGithubRepositoryRepository } from "../infrastructure/repositories/http.github-repository";
import { LRUCache } from "lru-cache";

const repository = new HttpGithubRepositoryRepository();

// ── Caches ────────────────────────────────────────────────────────────────────

/** Search results (shared across dateRange toggles) */
const searchCache = new LRUCache<string, GithubRepository[]>({
	max: 20,
	ttl: 1000 * 60 * 15, // 15 min — repos don't change often
});

/** Fully enriched results (per dateRange) */
const resultCache = new LRUCache<string, GithubWidgetInnerProps>({
	max: 30,
	ttl: 1000 * 60 * 30, // keep entries 30 min for stale serving
	allowStale: true,
});

/** Tracks when each result was last refreshed */
const refreshedAt = new Map<string, number>();

/** Prevents duplicate background refreshes */
const refreshing = new Set<string>();

/** Negative cache — prevents retry storms on API failures */
const errorCache = new LRUCache<string, true>({
	max: 20,
	ttl: 1000 * 30, // 30 seconds
});

const REFRESH_INTERVAL = 1000 * 60 * 5; // 5 min

// ── Key builders ──────────────────────────────────────────────────────────────

function searchKey(config: GithubWidgetConfig): string {
	return [
		config.createdAfter,
		config.createdBefore ?? "",
		config.language ?? "",
		(config.topics ?? []).sort().join(","),
		config.limit,
		config.minStars ?? "",
		config.maxStars ?? "",
	].join("|");
}

function resultKey(config: GithubWidgetConfig): string {
	return searchKey(config) + "|" + config.dateRange;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchGithubWidgetProps(
	config: GithubWidgetConfig
): Promise<GithubWidgetInnerProps> {
	const key = resultKey(config);
	const cached = resultCache.get(key);
	const lastRefresh = refreshedAt.get(key) ?? 0;
	const isStale = Date.now() - lastRefresh > REFRESH_INTERVAL;

	// Fresh cache → return immediately
	if (cached && !isStale) return cached;

	// Stale cache → serve immediately, refresh in background
	if (cached && isStale) {
		triggerBackgroundRefresh(key, config);
		return cached;
	}

	// No cache → blocking fetch (with negative cache check)
	if (errorCache.has(key)) {
		throw new Error("GitHub API temporarily unavailable, retrying shortly");
	}

	return freshFetch(key, config);
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function freshFetch(
	key: string,
	config: GithubWidgetConfig
): Promise<GithubWidgetInnerProps> {
	try {
		const sKey = searchKey(config);

		// Reuse search results across dateRange toggles
		let repos = searchCache.get(sKey);
		if (!repos) {
			repos = await repository.search(config);
			searchCache.set(sKey, repos);
		}

		const enriched = await repository.enrichWithRecentStars(
			repos,
			config.dateRange
		);

		const data = GithubWidgetInnerPropsSchema.parse({
			config,
			repositories: enriched,
		});

		resultCache.set(key, data);
		refreshedAt.set(key, Date.now());
		return data;
	} catch (error) {
		errorCache.set(key, true);
		throw error;
	}
}

function triggerBackgroundRefresh(
	key: string,
	config: GithubWidgetConfig
): void {
	if (refreshing.has(key)) return;
	refreshing.add(key);

	freshFetch(key, config)
		.catch((err) =>
			console.warn("[github] background refresh failed:", err)
		)
		.finally(() => refreshing.delete(key));
}
