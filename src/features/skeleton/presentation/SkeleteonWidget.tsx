import { z } from "zod";
import { SkeletonWidgetConfigSchema } from "../infrastructure/config.schemas";
import { WeatherWidgetSkeleton } from "@/features/weather/presentation/WeatherWidgetSkeleton";
import { RedditWidgetSkeleton } from "@/features/reddit/presentation/RedditWidgetSkeleton";
import { FeedWidgetSkeleton } from "@/features/feed/presentation/FeedWidgetSkeleton";
import { YoutubeWidgetSkeleton } from "@/features/youtube/presentation/YoutubeWidgetSkeleton";
import { TabsWidgetSkeleton } from "@/features/tabs/presentation/TabsWidgetSkeleton";
import { BookmarkWidgetSkeleton } from "@/features/bookmark/presentation/BookmarkWidgetSkeleton";

export const SkeletonWidgetPropsSchema = z.object({
	config: SkeletonWidgetConfigSchema,
});

export type SkeletonWidgetProps = z.infer<typeof SkeletonWidgetPropsSchema>;

export const SkeletonWidget = ({ config }: SkeletonWidgetProps) => {
	switch (config.derivedFrom) {
		case "weather":
			return <WeatherWidgetSkeleton />;
		case "reddit":
			return <RedditWidgetSkeleton />;
		case "youtube":
			return <YoutubeWidgetSkeleton />;
		case "feed":
			return <FeedWidgetSkeleton />;
		case "tabs":
			return <TabsWidgetSkeleton />;
		case "bookmark":
			return <BookmarkWidgetSkeleton />;
	}
};
