import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeedWidgetSkeleton } from "./FeedWidgetSkeleton";

const meta = {
	title: "features/feed/FeedWidgetSkeleton",
	component: FeedWidgetSkeleton,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof FeedWidgetSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
