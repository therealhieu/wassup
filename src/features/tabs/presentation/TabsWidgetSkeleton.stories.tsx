import type { Meta, StoryObj } from "@storybook/react";
import { TabsWidgetSkeleton } from "./TabsWidgetSkeleton";

const meta = {
	title: "features/tabs/TabsWidgetSkeleton",
	component: TabsWidgetSkeleton,
	tags: ["autodocs"],
} satisfies Meta<typeof TabsWidgetSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
