import { WidgetProps } from "@/lib/schemas";
import { StateCreator } from "zustand";
import { widgetDataSlice } from "./widget-cache-slice.schemas";

export const createwidgetDataSlice = (
	initalwidgetData: Record<string, WidgetProps>
): StateCreator<widgetDataSlice> => {
	return (set) => ({
		widgetData: initalwidgetData || {},
		setWidgetData: (widgetData: Record<string, WidgetProps>) =>
			set({ widgetData: widgetData }),
		setItem: (widgetConfigJson: string, widgetProps: WidgetProps) =>
			set((state) => ({
				widgetData: {
					...state.widgetData,
					[widgetConfigJson]: widgetProps,
				},
			})),
		removeItem: (widgetConfigJson: string) =>
			set((state) => {
				const newEntries = Object.entries(state.widgetData).filter(
					([key]) => key !== widgetConfigJson
				);
				return {
					widgetData: Object.fromEntries(newEntries),
				};
			}),
		clearWidgetData: () => set({ widgetData: {} }),
	});
};
