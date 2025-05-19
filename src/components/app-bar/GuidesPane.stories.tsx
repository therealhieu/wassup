import type { Meta, StoryObj } from "@storybook/react";
import { GuidesPanel } from "./GuidesPanel";

const meta: Meta<typeof GuidesPanel> = {
	title: "Components/AppBar/GuidesPanel",
	component: GuidesPanel,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof GuidesPanel>;

export const Default: Story = {
	args: {
		open: true,
	},
};

export const Closed: Story = {
	args: {
		open: false,
	},
};
