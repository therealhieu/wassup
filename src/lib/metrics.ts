import {
	Registry,
	Histogram,
	Counter,
	collectDefaultMetrics,
} from "prom-client";

// globalThis singleton guard — prevents "metric already registered" errors
// during Next.js HMR in development (same pattern as prisma.ts)
const globalForMetrics = globalThis as unknown as {
	metricsRegistry: Registry;
};

export const register = (globalForMetrics.metricsRegistry ??= (() => {
	const r = new Registry();
	collectDefaultMetrics({ register: r });
	return r;
})());

export const serverActionDuration = new Histogram({
	name: "wassup_server_action_duration_seconds",
	help: "Duration of server action calls",
	labelNames: ["action", "status"] as const,
	buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
	registers: [register],
});

export const cacheHits = new Counter({
	name: "wassup_cache_hits_total",
	help: "Number of LRU cache hits",
	labelNames: ["cache"] as const,
	registers: [register],
});

export const cacheMisses = new Counter({
	name: "wassup_cache_misses_total",
	help: "Number of LRU cache misses",
	labelNames: ["cache"] as const,
	registers: [register],
});
