import type { Meta, StoryObj } from "@storybook/react";
import { FeedWidgetInner } from "./FeedWidgetInner";

const meta: Meta<typeof FeedWidgetInner> = {
	title: "features/feed/FeedWidgetInner",
	component: FeedWidgetInner,
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FeedWidgetInner>;

export const Default: Story = {
	args: {
		config: {
			type: "feed",
			urls: [
				"https://example.com/feed1",
				"https://example.com/feed2",
				"https://blog.example.com/feed",
			],
			limit: 3,
			showTitle: true,
			scrollAfterRow: 3,
		},
		feeds: [
			{
				title: "Example Feed Item 1",
				feedUrl: "https://example.com/article1",
				thumbnailUrl: "https://picsum.photos/800/400",
				publishedAt: new Date().toISOString(),
				description: "This is the first example feed item.",
				categories: ["Technology", "News"],
				source: "Example News",
				author: "John Doe",
			},
			{
				title: "Example Feed Item 2",
				feedUrl: "https://example.com/article2",
				publishedAt: new Date().toISOString(),
				description:
					"This is the second example feed item from a different source.",
				categories: ["Article"],
				source: "Example Blog",
				author: "Jane Smith",
			},
			{
				title: "Example Feed Item 3",
				feedUrl: "https://blog.example.com/article3",
				thumbnailUrl: "https://picsum.photos/800/400",
				publishedAt: new Date().toISOString(),
				description:
					"This is the third example feed item from yet another source.",
				categories: ["News"],
				source: "Example Source",
				author: "Bob Wilson",
			},
		],
	},
};

export const MultipleSourcesEmpty: Story = {
	args: {
		config: {
			type: "feed",
			urls: [
				"https://example.com/feed1",
				"https://example.com/feed2",
				"https://blog.example.com/feed",
			],
			limit: 10,
			showTitle: true,
			scrollAfterRow: 3,
		},
		feeds: [],
	},
};
