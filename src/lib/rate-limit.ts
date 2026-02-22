import { LRUCache } from "lru-cache";

interface RateLimitResult {
	success: boolean;
	remaining: number;
}

/**
 * Sliding-window rate limiter backed by LRUCache.
 *
 * @param limit     Max requests per window per token
 * @param windowMs  Window duration in milliseconds
 * @param maxTokens Max distinct tokens to track (prevents OOM)
 */
export function createRateLimiter(
	limit: number,
	windowMs: number,
	maxTokens = 500,
) {
	const cache = new LRUCache<string, number[]>({
		max: maxTokens,
		ttl: windowMs,
	});

	return {
		check(token: string): RateLimitResult {
			const now = Date.now();
			const windowStart = now - windowMs;
			const timestamps = (cache.get(token) ?? []).filter(
				(t) => t > windowStart,
			);

			if (timestamps.length >= limit) {
				return { success: false, remaining: 0 };
			}

			timestamps.push(now);
			cache.set(token, timestamps);
			return { success: true, remaining: limit - timestamps.length };
		},
	};
}
