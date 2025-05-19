import type { Meta, StoryObj } from "@storybook/react";
import { EditorPanel } from "./EditorPanel";
import { AppStoreContextProvider } from "@/providers/AppStoreContextProvider";
import { DEFAULT_CONFIG } from "@/lib/constants";

const meta: Meta<typeof EditorPanel> = {
	title: "Components/AppBar/EditorPanel",
	component: EditorPanel,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<AppStoreContextProvider
				initialState={{ appConfig: DEFAULT_CONFIG }}
				session={null}
			>
				<Story />
			</AppStoreContextProvider>
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
