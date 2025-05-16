import type { Meta, StoryObj } from "@storybook/react";
import { SkeletonWidget } from "./SkeleteonWidget";

const meta: Meta<typeof SkeletonWidget> = {
	component: SkeletonWidget,
	title: "features/skeleton/SkeletonWidget",
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SkeletonWidget>;

export const WeatherSkeleton: Story = {
	args: {
		config: {
			type: "skeleton",
			maxWidth: 500,
			maxHeight: 500,
			derivedFrom: "weather",
		},
	},
};

export const RedditSkeleton: Story = {
	args: {
		config: {
			type: "skeleton",
			maxWidth: 500,
			maxHeight: 500,
			derivedFrom: "reddit",
		},
	},
};

export const YoutubeSkeleton: Story = {
	args: {
		config: {
			type: "skeleton",
			maxWidth: 500,
			maxHeight: 500,
			derivedFrom: "youtube",
		},
	},
};

export const FeedSkeleton: Story = {
	args: {
		config: {
			type: "skeleton",
			maxWidth: 500,
			maxHeight: 500,
			derivedFrom: "feed",
		},
	},
};

export const TabsSkeleton: Story = {
	args: {
		config: {
			type: "skeleton",
			maxWidth: 500,
			maxHeight: 500,
			derivedFrom: "tabs",
		},
	},
};

export const BookmarkSkeleton: Story = {
	args: {
		config: {
			type: "skeleton",
			maxWidth: 500,
			maxHeight: 500,
			derivedFrom: "bookmark",
		},
	},
};
