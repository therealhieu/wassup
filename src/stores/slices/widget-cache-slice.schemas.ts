import { WidgetPropsSchema } from "@/lib/schemas";
import { z } from "zod";

export const widgetDataSliceSchema = z.object({
	widgetData: z.record(z.string(), WidgetPropsSchema.nullable()),
	setwidgetData: z
		.function()
		.args(z.string(), WidgetPropsSchema)
		.returns(z.void()),
	removewidgetData: z.function().args(z.string()).returns(z.void()),
	clearwidgetData: z.function().returns(z.void()),
});

export type widgetDataSlice = z.infer<typeof widgetDataSliceSchema>;
