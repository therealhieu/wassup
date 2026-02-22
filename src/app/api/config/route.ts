import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

// 30 requests per minute per user
const limiter = createRateLimiter(30, 60_000);
const MAX_PAYLOAD_SIZE = 500_000; // 500KB

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

	// Server is a blind vault — returns opaque ciphertext + salt
	return NextResponse.json({
		encryptedData: record?.data ?? null,
		salt: record?.salt ?? null,
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
	const { encryptedData, salt } = body;

	// Cannot validate structure — data is ciphertext. Only validate shape/size.
	if (
		typeof encryptedData !== "string" ||
		typeof salt !== "string" ||
		encryptedData.length > MAX_PAYLOAD_SIZE ||
		salt.length > 100
	) {
		return NextResponse.json(
			{ error: "Invalid payload" },
			{ status: 400 },
		);
	}

	await prisma.userConfig.upsert({
		where: { userId: session.user.id },
		create: { userId: session.user.id, data: encryptedData, salt },
		update: { data: encryptedData, salt },
	});

	return NextResponse.json({ ok: true });
}
