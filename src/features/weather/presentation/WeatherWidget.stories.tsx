import type { Meta, StoryObj } from '@storybook/react';
import { WeatherWidget } from './WeatherWidget';

const meta: Meta<typeof WeatherWidget> = {
    title: 'Weather/WeatherWidget',
    component: WeatherWidget,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WeatherWidget>;

export const Primary: Story = {
    args: {
        location: 'Ho Chi Minh City',
        reports: [
            {
                date: new Date("2025-05-05T00:00:00.000Z"),
                temperatureMax: 35.70000076293945,
                temperatureMin: 25.600000381469727,
                precipitationProbability: 13,
                precipitationHours: 0,
                windSpeed: 0,
                uvIndex: 9.199999809265137,
                cloudCover: 52.375,
                weatherCode: 3,
            }, {
                date: new Date("2025-05-06T00:00:00.000Z"),
                temperatureMax: 34.29999923706055,
                temperatureMin: 26.100000381469727,
                precipitationProbability: 23,
                precipitationHours: 2,
                windSpeed: 0,
                uvIndex: 8.949999809265137,
                cloudCover: 59.58333206176758,
                weatherCode: 95,
            }, {
                date: new Date("2025-05-07T00:00:00.000Z"),
                temperatureMax: 35.29999923706055,
                temperatureMin: 26.049999237060547,
                precipitationProbability: 18,
                precipitationHours: 2,
                windSpeed: 0,
                uvIndex: 9.199999809265137,
                cloudCover: 46.625,
                weatherCode: 3,
            }, {
                date: new Date("2025-05-08T00:00:00.000Z"),
                temperatureMax: 36.150001525878906,
                temperatureMin: 26.350000381469727,
                precipitationProbability: 13,
                precipitationHours: 4,
                windSpeed: 0,
                uvIndex: 9.149999618530273,
                cloudCover: 46.91666793823242,
                weatherCode: 3,
            }, {
                date: new Date("2025-05-09T00:00:00.000Z"),
                temperatureMax: 36.04999923706055,
                temperatureMin: 26.600000381469727,
                precipitationProbability: 23,
                precipitationHours: 9,
                windSpeed: 0,
                uvIndex: 8.699999809265137,
                cloudCover: 73.25,
                weatherCode: 80,
            }
        ]
    },
};
