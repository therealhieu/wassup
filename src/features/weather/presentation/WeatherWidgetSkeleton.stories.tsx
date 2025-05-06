import type { Meta, StoryObj } from '@storybook/react';
import { WeatherWidgetSkeleton } from './WeatherWidgetSkeleton';

const meta: Meta<typeof WeatherWidgetSkeleton> = {
    title: 'Weather/WeatherWidgetSkeleton',
    component: WeatherWidgetSkeleton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WeatherWidgetSkeleton>;

export const Primary: Story = {
    args: {}
};
