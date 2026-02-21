import { BookmarkWidgetInner } from "./BookmarkWidgetInner";
import { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof BookmarkWidgetInner> = {
	title: "Features/bookmark/BookmarkWidgetInner",
	component: BookmarkWidgetInner,
	tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof BookmarkWidgetInner>;

export const DetailedBookmark: Story = {
	args: {
		config: {
			type: "bookmark",
			title: "Bookmarks",
			bookmarks: [
				{ title: "Google", url: "https://www.google.com" },
				{ title: "GitHub", url: "https://github.com" },
			],
			groups: [
				{
					title: "Social Media",
					bookmarks: [
						{ title: "Twitter", url: "https://twitter.com" },
						{ title: "Facebook", url: "https://facebook.com" },
					],
				},
			],
		},
	},
};

export const UrlBookmark: Story = {
	args: {
		config: {
			type: "bookmark",
			title: "Bookmarks",
			bookmarks: [
				"https://www.google.com",
				"https://github.com",
				"https://youtube.com",
			],
			groups: [
				{
					title: "Social Media",
					bookmarks: ["https://reddit.com", "https://instagram.com"],
				},
			],
		},
	},
};
