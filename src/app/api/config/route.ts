import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppStateSchema } from "@/infrastructure/config.schemas";
import { createRateLimiter } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

// 30 requests per minute per user
const limiter = createRateLimiter(30, 60_000);

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { success } = limiter.check(session.user.id);
	if (!success) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{ status: 429 },
		);
	}

	const record = await prisma.userConfig.findUnique({
		where: { userId: session.user.id },
	});

	// Return raw JSON — client-side migrateToAppState handles both shapes
	return NextResponse.json({
		state: record ? JSON.parse(record.data) : null,
	});
}

export async function PUT(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (!validateOrigin(request)) {
		return NextResponse.json(
			{ error: "CSRF validation failed" },
			{ status: 403 },
		);
	}

	const { success } = limiter.check(session.user.id);
	if (!success) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{ status: 429 },
		);
	}

	const body = await request.json();
	const parsed = AppStateSchema.safeParse(body.state);

	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Invalid state", details: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	await prisma.userConfig.upsert({
		where: { userId: session.user.id },
		create: { userId: session.user.id, data: JSON.stringify(parsed.data) },
		update: { data: JSON.stringify(parsed.data) },
	});

	return NextResponse.json({ ok: true });
}

