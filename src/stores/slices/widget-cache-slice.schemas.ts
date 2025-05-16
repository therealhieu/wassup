import { WidgetPropsSchema } from "@/lib/schemas";
import { z } from "zod";

export const widgetDataSliceSchema = z.object({
	widgetData: z.record(z.string(), WidgetPropsSchema.nullable()),
	setWidgetData: z
		.function()
		.args(z.record(z.string(), WidgetPropsSchema))
		.returns(z.void()),
	setItem: z.function().args(z.string(), WidgetPropsSchema).returns(z.void()),
	removeItem: z.function().args(z.string()).returns(z.void()),
	clearWidgetData: z.function().returns(z.void()),
});

export type widgetDataSlice = z.infer<typeof widgetDataSliceSchema>;
