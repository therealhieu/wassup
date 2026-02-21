import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorPanel } from "./EditorPanel";
import { AppConfigProvider } from "@/providers/AppConfigProvider";

const meta: Meta<typeof EditorPanel> = {
	title: "Components/AppBar/EditorPanel",
	component: EditorPanel,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<AppConfigProvider>
				<Story />
			</AppConfigProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof EditorPanel>;

export const Default: Story = {
	args: {
		open: true,
		onClose: () => console.log("Dialog closed"),
	},
};

export const Closed: Story = {
	args: {
		open: false,
		onClose: () => console.log("Dialog closed"),
	},
};
