import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

	const csp = [
		`default-src 'self'`,
		// 'strict-dynamic' trusts scripts loaded by already-trusted scripts
		`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
		// MUI injects styles via <style> tags — 'unsafe-inline' is required
		`style-src 'self' 'unsafe-inline'`,
		`img-src 'self' https: data: blob:`,
		`font-src 'self'`,
		`connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com`,
		`frame-ancestors 'none'`,
		`base-uri 'self'`,
		`form-action 'self' https://github.com`,
	].join("; ");

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);

	const response = NextResponse.next({ request: { headers: requestHeaders } });
	response.headers.set("Content-Security-Policy", csp);

	return response;
}

export const config = {
	matcher: [
		// Match all paths except static files and images
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
