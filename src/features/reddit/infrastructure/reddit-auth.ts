import { baseLogger } from "@/lib/logger";

const logger = baseLogger.getSubLogger({ name: "RedditAuth" });

/**
 * Server-side Reddit OAuth token service.
 *
 * Uses client_credentials grant (no user login required).
 * Token is cached in-memory with a 5-minute expiry buffer.
 * Concurrent callers share a single in-flight refresh promise (mutex).
 *
 * If env vars are missing or token fetch fails, returns null —
 * the repository falls back to the unauthenticated endpoint.
 */
class RedditAuthService {
	private token: string | null = null;
	private expiresAt = 0;
	private refreshPromise: Promise<string | null> | null = null;

	private static readonly EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
	private static readonly TOKEN_URL =
		"https://www.reddit.com/api/v1/access_token";

	get isConfigured(): boolean {
		return !!(
			process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET
		);
	}

	async getAccessToken(): Promise<string | null> {
		if (!this.isConfigured) return null;

		// Return cached token if still valid (with buffer)
		if (this.token && Date.now() < this.expiresAt) {
			return this.token;
		}

		// Mutex: if a refresh is already in-flight, all callers await the same promise
		if (this.refreshPromise) {
			return this.refreshPromise;
		}

		this.refreshPromise = this.refresh();

		try {
			return await this.refreshPromise;
		} finally {
			this.refreshPromise = null;
		}
	}

	private async refresh(): Promise<string | null> {
		const clientId = process.env.REDDIT_CLIENT_ID!;
		const clientSecret = process.env.REDDIT_CLIENT_SECRET!;

		try {
			const credentials = Buffer.from(
				`${clientId}:${clientSecret}`
			).toString("base64");

			const response = await fetch(RedditAuthService.TOKEN_URL, {
				method: "POST",
				headers: {
					Authorization: `Basic ${credentials}`,
					"Content-Type": "application/x-www-form-urlencoded",
					"User-Agent": "wassup-dashboard/1.0",
				},
				body: "grant_type=client_credentials",
			});

			if (!response.ok) {
				logger.warn(
					`Reddit token request failed: ${response.status} ${response.statusText}`
				);
				return null;
			}

			const data = (await response.json()) as {
				access_token: string;
				expires_in: number;
			};

			this.token = data.access_token;
			this.expiresAt =
				Date.now() +
				data.expires_in * 1000 -
				RedditAuthService.EXPIRY_BUFFER_MS;

			logger.info(
				`Reddit OAuth token acquired, expires in ${data.expires_in}s`
			);
			return this.token;
		} catch (error) {
			const err = error as Error;
			logger.warn(`Reddit token fetch error: ${err.message}`);
			this.token = null;
			this.expiresAt = 0;
			return null;
		}
	}
}

export const redditAuth = new RedditAuthService();
