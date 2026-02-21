import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YoutubeCardSkeleton } from "./YoutubeCardSkeleton";

const meta = {
	title: "features/youtube/YoutubeCardSkeleton",
	component: YoutubeCardSkeleton,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof YoutubeCardSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const Multiple: Story = {
	render: () => (
		<div className="space-y-4">
			<YoutubeCardSkeleton />
			<YoutubeCardSkeleton />
			<YoutubeCardSkeleton />
		</div>
	),
};
