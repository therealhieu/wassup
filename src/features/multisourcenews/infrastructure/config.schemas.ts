import { z } from "zod";
import { HackerNewsWidgetConfigSchema } from "@/features/hackernews/infrastructure/config.schemas";
import { LobstersWidgetConfigSchema } from "@/features/lobsters/infrastructure/config.schemas";
import { DevtoWidgetConfigSchema } from "@/features/devto/infrastructure/config.schemas";

export const MultiSourceNewsWidgetConfigSchema = z.object({
	type: z.literal("multisourcenews"),
	hackernews: HackerNewsWidgetConfigSchema,
	lobsters: LobstersWidgetConfigSchema,
	devto: DevtoWidgetConfigSchema.optional(),
	scrollAfterRow: z.number().int().positive().optional(),
});

export type MultiSourceNewsWidgetConfig = z.infer<
	typeof MultiSourceNewsWidgetConfigSchema
>;
