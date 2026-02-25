import {
	Registry,
	Histogram,
	Counter,
	collectDefaultMetrics,
} from "prom-client";

// Singleton guard — caches the registry AND all metrics on globalThis to
// prevent "metric already registered" errors when Next.js re-evaluates
// this module in production (same pattern as prisma.ts).
const globalForMetrics = globalThis as unknown as {
	__metrics: {
		register: Registry;
		serverActionDuration: Histogram<"action" | "status">;
		cacheHits: Counter<"cache">;
		cacheMisses: Counter<"cache">;
	};
};

const metrics = (globalForMetrics.__metrics ??= (() => {
	const register = new Registry();
	collectDefaultMetrics({ register });

	const serverActionDuration = new Histogram({
		name: "wassup_server_action_duration_seconds",
		help: "Duration of server action calls",
		labelNames: ["action", "status"] as const,
		buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
		registers: [register],
	});

	const cacheHits = new Counter({
		name: "wassup_cache_hits_total",
		help: "Number of LRU cache hits",
		labelNames: ["cache"] as const,
		registers: [register],
	});

	const cacheMisses = new Counter({
		name: "wassup_cache_misses_total",
		help: "Number of LRU cache misses",
		labelNames: ["cache"] as const,
		registers: [register],
	});

	return { register, serverActionDuration, cacheHits, cacheMisses };
})());

export const { register, serverActionDuration, cacheHits, cacheMisses } =
	metrics;
