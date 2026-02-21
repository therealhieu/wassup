import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookmarkWidgetSkeleton } from "./BookmarkWidgetSkeleton";

const meta: Meta<typeof BookmarkWidgetSkeleton> = {
	title: "Features/bookmark/BookmarkWidgetSkeleton",
	component: BookmarkWidgetSkeleton,
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BookmarkWidgetSkeleton>;

export const Default: Story = {};
