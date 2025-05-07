import { WidgetPropsSchema } from "@/lib/schemas";
import { z } from "zod";

export const WidgetCacheSliceSchema = z.object({
	widgetCache: z.record(z.string(), WidgetPropsSchema.nullable()),
	setWidgetCache: z
		.function()
		.args(z.string(), WidgetPropsSchema)
		.returns(z.void()),
	removeWidgetCache: z.function().args(z.string()).returns(z.void()),
	clearWidgetCache: z.function().returns(z.void()),
});

export type WidgetCacheSlice = z.infer<typeof WidgetCacheSliceSchema>;
