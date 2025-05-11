import type { Meta, StoryObj } from "@storybook/react";
import { YoutubeWidgetSkeleton } from "./YoutubeWidgetSkeleton";

const meta: Meta<typeof YoutubeWidgetSkeleton> = {
	title: "features/youtube/YoutubeWidgetSkeleton",
	component: YoutubeWidgetSkeleton,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof YoutubeWidgetSkeleton>;

export const Default: Story = {
	args: {},
};
