import { z } from "zod";

export const LobstersWidgetConfigSchema = z.object({
	type: z.literal("lobsters"),
	sort: z.enum(["hottest", "newest", "active"]).default("hottest"),
	tag: z.string().optional(),
	limit: z.number().int().positive().max(25).default(10),
	hideTitle: z.boolean().default(false),
});

export type LobstersWidgetConfig = z.infer<typeof LobstersWidgetConfigSchema>;
