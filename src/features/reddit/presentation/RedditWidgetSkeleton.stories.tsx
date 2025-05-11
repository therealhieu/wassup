import type { Meta, StoryObj } from "@storybook/react";
import { RedditWidgetSkeleton } from "./RedditWidgetSkeleton";

/**
 * Skeleton loading component for the Reddit widget.
 * Displays a placeholder UI while the actual Reddit content is being loaded.
 */
const meta: Meta<typeof RedditWidgetSkeleton> = {
	title: "features/reddit/RedditWidgetSkeleton",
	component: RedditWidgetSkeleton,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof RedditWidgetSkeleton>;

/**
 * Default state of the Reddit widget skeleton.
 */
export const Default: Story = {
	args: {},
};
