import type { Meta, StoryObj } from "@storybook/react";
import { ConfigEditor } from "./ConfigEditor";

const meta: Meta<typeof ConfigEditor> = {
	component: ConfigEditor,
	title: "Components/ConfigEditor",
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ConfigEditor>;

const defaultConfig = `ui:
  theme: light
  pages:
    - title: Home
      path: /
      columns:
        - size: 12
          widgets: []
`;

export const Default: Story = {
	render: () => <ConfigEditor value={defaultConfig} />,
};
