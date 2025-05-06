import type { Meta, StoryObj } from '@storybook/react';
import { ErrorWidget } from './ErrorWidget';

const meta = {
    title: 'components/ErrorWidget',
    component: ErrorWidget,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ErrorWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};

export const WithError: Story = {
    args: {
        error: new Error('This is a test error')
    }
};
