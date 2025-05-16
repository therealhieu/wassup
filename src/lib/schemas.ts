import { RedditWidgetInnerPropsSchema } from "@/features/reddit/presentation/RedditWidgetInner";
import { WeatherWidgetInnerPropsSchema } from "../features/weather/presentation/WeatherWidget.components";
import { YoutubeWidgetInnerPropsSchema } from "@/features/youtube/presentation/YoutubeWidgetInner";
import { FeedWidgetInnerPropsSchema } from "@/features/feed/presentation/FeedWidgetInner";
import { TabsWidgetPropsSchema } from "@/features/tabs/presentation/TabWidget";
import { z } from "zod";

export const WidgetPropsSchema = z.union([
	WeatherWidgetInnerPropsSchema,
	RedditWidgetInnerPropsSchema,
	YoutubeWidgetInnerPropsSchema,
	FeedWidgetInnerPropsSchema,
	TabsWidgetPropsSchema,
]);

export type WidgetProps = z.infer<typeof WidgetPropsSchema>;
