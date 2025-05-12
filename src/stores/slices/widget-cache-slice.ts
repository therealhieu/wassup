import { WidgetProps } from "@/lib/schemas";
import { StateCreator } from "zustand";
import { widgetDataSlice } from "./widget-cache-slice.schemas";

export const createwidgetDataSlice = (
	initalwidgetData: Record<string, WidgetProps | null>
): StateCreator<widgetDataSlice> => {
	return (set) => ({
		widgetData: initalwidgetData,
		setwidgetData: (widgetConfigJson: string, widgetProps: WidgetProps) =>
			set((state) => ({
				widgetData: {
					...state.widgetData,
					[widgetConfigJson]: widgetProps,
				},
			})),
		removewidgetData: (widgetConfigJson: string) =>
			set((state) => {
				const newEntries = Object.entries(state.widgetData).filter(
					([key]) => key !== widgetConfigJson
				);
				return {
					widgetData: Object.fromEntries(newEntries),
				};
			}),

		clearwidgetData: () => set({ widgetData: {} }),
	});
};
