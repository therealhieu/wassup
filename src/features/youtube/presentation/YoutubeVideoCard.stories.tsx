import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YoutubeVideoCard } from "./YoutubeVideoCard";

const meta: Meta<typeof YoutubeVideoCard> = {
	component: YoutubeVideoCard,
	title: "features/youtube/YoutubeVideoCard",
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof YoutubeVideoCard>;

export const Default: Story = {
	args: {
		id: "yt:video:9KUC_nHydZg",
		title: "Harmful Content Detection / Content Moderation | ML System Design Problem Breakdown",
		url: "https://www.youtube.com/watch?v=9KUC_nHydZg",
		authorName: "Hello Interview - SWE Interview Preparation",
		authorUrl: "https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
		thumbnailUrl: "https://i2.ytimg.com/vi/9KUC_nHydZg/hqdefault.jpg",
		views: 5168,
		publishedAt: new Date("2025-05-04T16:00:10.000Z"),
	},
};
