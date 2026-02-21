import type { Meta, StoryObj } from "@storybook/react";
import { SchemaDocPanel } from "./SchemaDocPanel";

const meta: Meta<typeof SchemaDocPanel> = {
    title: "Components/AppBar/SchemaDocPanel",
    component: SchemaDocPanel,
    parameters: {
        layout: "centered",
    },
};

export default meta;
type Story = StoryObj<typeof SchemaDocPanel>;

export const Default: Story = {};
