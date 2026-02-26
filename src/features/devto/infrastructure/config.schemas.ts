import { z } from "zod";

export const DevtoWidgetConfigSchema = z.object({
	type: z.literal("devto"),
	tags: z.array(z.string()).optional(),
	top: z.enum(["1", "7", "30", "365"]).default("7"),
	limit: z.number().int().positive().max(30).default(10),
	hideTitle: z.boolean().default(false),
});

export type DevtoWidgetConfig = z.infer<typeof DevtoWidgetConfigSchema>;
