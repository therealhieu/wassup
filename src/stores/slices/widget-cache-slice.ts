import { WidgetProps } from "@/lib/schemas";
import { StateCreator } from "zustand";
import { WidgetCacheSlice } from "./widget-cache-slice.schemas";

export const createWidgetCacheSlice = (
	initalWidgetCache: Record<string, WidgetProps | null>
): StateCreator<WidgetCacheSlice> => {
	return (set) => ({
		widgetCache: initalWidgetCache,
		setWidgetCache: (widgetConfigJson: string, widgetProps: WidgetProps) =>
			set((state) => ({
				widgetCache: {
					...state.widgetCache,
					[widgetConfigJson]: widgetProps,
				},
			})),
		removeWidgetCache: (widgetConfigJson: string) =>
			set((state) => {
				const newEntries = Object.entries(state.widgetCache).filter(
					([key]) => key !== widgetConfigJson
				);
				return {
					widgetCache: Object.fromEntries(newEntries),
				};
			}),

		clearWidgetCache: () => set({ widgetCache: {} }),
	});
};
