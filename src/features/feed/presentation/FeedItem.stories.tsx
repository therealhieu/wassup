import type { Meta, StoryObj } from "@storybook/react";
import { FeedItem } from "./FeedItem";

const meta: Meta<typeof FeedItem> = {
	title: "features/feed/FeedItem",
	component: FeedItem,
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FeedItem>;

export const Default: Story = {
	args: {
		title: "Example Feed Item",
		feedUrl: "https://example.com/article",
		thumbnailUrl: "https://picsum.photos/800/400",
		publishedAt: new Date().toISOString(),
		description:
			"This is an example feed item with a description that shows how the component renders with typical content.",
		categories: ["Technology", "News", "Example"],
		source: "Example News",
		author: "John Doe",
	},
};

export const WithoutThumbnail: Story = {
	args: {
		title: "Article Without Image",
		feedUrl: "https://example.com/text-article",
		publishedAt: new Date().toISOString(),
		description:
			"This example shows how the feed item looks without a thumbnail image.",
		categories: ["Article"],
		source: "Example Blog",
	},
};

export const WithoutDescription: Story = {
	args: {
		title: "Minimal Feed Item",
		feedUrl: "https://example.com/minimal",
		thumbnailUrl: "https://picsum.photos/800/400",
		publishedAt: new Date().toISOString(),
		categories: [],
		source: "Example Source",
	},
};
