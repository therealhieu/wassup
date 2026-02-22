/**
 * Validates that the request Origin matches the Host header.
 * This prevents cross-site request forgery on mutation endpoints.
 *
 * GET requests are exempt (safe method).
 * Requests without an Origin header (e.g. server-to-server) are rejected
 * for browser-facing mutation routes.
 */
export function validateOrigin(request: Request): boolean {
	const origin = request.headers.get("origin");
	const host =
		request.headers.get("x-forwarded-host") || request.headers.get("host");

	if (!origin || !host) return false;

	try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
}
