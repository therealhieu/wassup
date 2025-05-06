import { themes } from '@storybook/theming';
import React from 'react';

import type { Preview } from '@storybook/react'

const preview: Preview = {
  parameters: {
    docs: {
      theme: themes.light,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => {
      const initialConfig = {
        "server": {
          "port": 5000
        },
        "ui": {
          "theme": "light",
          "pages": [
            {
              "title": "Home",
              "path": "/",
              "columns": [
                {
                  "size": 2,
                  "widgets": [
                    {
                      "type": "weather",
                      "location": "Tokyo"
                    }
                  ]
                },
                {
                  "size": 7,
                  "widgets": [
                    {
                      "type": "weather",
                      "location": "Hanoi"
                    }
                  ]
                },
                {
                  "size": 3,
                  "widgets": [
                    {
                      "type": "weather",
                      "location": "Ho Chi Minh City"
                    }
                  ]
                }
              ]
            },
            {
              "title": "News",
              "path": "/news",
              "columns": [
                {
                  "size": 3,
                  "widgets": [
                    {
                      "type": "weather",
                      "location": "Ho Chi Minh City"
                    }
                  ]
                }
              ]
            }
          ]
        }
      };

      const initialWidgetData = {
        "{\"type\":\"weather\",\"provider\":\"openmeteo\",\"geonames\":{\"outputPath\":\"resources/geonames\",\"dataset\":\"cities15000\"},\"location\":\"Tokyo\",\"granularity\":\"daily\",\"forecastDays\":5,\"temperatureUnit\":\"C\"}": {
          "location": "Tokyo",
          "reports": [
            {
              "date": "2025-05-06T00:00:00.000Z",
              "temperatureMax": 16.450000762939453,
              "temperatureMin": 12.199999809265137,
              "precipitationProbability": 100,
              "precipitationHours": 11,
              "windSpeed": 0,
              "uvIndex": 2.450000047683716,
              "cloudCover": 71.16666412353516,
              "weatherCode": 63
            },
            {
              "date": "2025-05-07T00:00:00.000Z",
              "temperatureMax": 21.5,
              "temperatureMin": 11.75,
              "precipitationProbability": 28,
              "precipitationHours": 3,
              "windSpeed": 0,
              "uvIndex": 7.949999809265137,
              "cloudCover": 51.16666793823242,
              "weatherCode": 61
            },
            {
              "date": "2025-05-08T00:00:00.000Z",
              "temperatureMax": 20.049999237060547,
              "temperatureMin": 12.600000381469727,
              "precipitationProbability": 18,
              "precipitationHours": 0,
              "windSpeed": 0,
              "uvIndex": 7.75,
              "cloudCover": 29.16666603088379,
              "weatherCode": 2
            },
            {
              "date": "2025-05-09T00:00:00.000Z",
              "temperatureMax": 22.049999237060547,
              "temperatureMin": 16.67449951171875,
              "precipitationProbability": 95,
              "precipitationHours": 14,
              "windSpeed": 0,
              "uvIndex": 6.599999904632568,
              "cloudCover": 90.95833587646484,
              "weatherCode": 63
            },
            {
              "date": "2025-05-10T00:00:00.000Z",
              "temperatureMax": 19.12449836730957,
              "temperatureMin": 17.324499130249023,
              "precipitationProbability": 68,
              "precipitationHours": 1,
              "windSpeed": 0,
              "uvIndex": 3.5999999046325684,
              "cloudCover": 100,
              "weatherCode": 45
            }
          ]
        },
        "{\"type\":\"weather\",\"provider\":\"openmeteo\",\"geonames\":{\"outputPath\":\"resources/geonames\",\"dataset\":\"cities15000\"},\"location\":\"Hanoi\",\"granularity\":\"daily\",\"forecastDays\":5,\"temperatureUnit\":\"C\"}": {
          "location": "Hanoi",
          "reports": [
            {
              "date": "2025-05-06T00:00:00.000Z",
              "temperatureMax": 33.888999938964844,
              "temperatureMin": 25.588998794555664,
              "precipitationProbability": 40,
              "precipitationHours": 12,
              "windSpeed": 0,
              "uvIndex": 5.849999904632568,
              "cloudCover": 94.20833587646484,
              "weatherCode": 96
            },
            {
              "date": "2025-05-07T00:00:00.000Z",
              "temperatureMax": 31.18899917602539,
              "temperatureMin": 25.68899917602539,
              "precipitationProbability": 23,
              "precipitationHours": 7,
              "windSpeed": 0,
              "uvIndex": 6,
              "cloudCover": 96.58333587646484,
              "weatherCode": 95
            },
            {
              "date": "2025-05-08T00:00:00.000Z",
              "temperatureMax": 36.28900146484375,
              "temperatureMin": 26.888999938964844,
              "precipitationProbability": 3,
              "precipitationHours": 0,
              "windSpeed": 0,
              "uvIndex": 8.300000190734863,
              "cloudCover": 56.45833206176758,
              "weatherCode": 3
            },
            {
              "date": "2025-05-09T00:00:00.000Z",
              "temperatureMax": 37.0890007019043,
              "temperatureMin": 25.93899917602539,
              "precipitationProbability": 48,
              "precipitationHours": 11,
              "windSpeed": 0,
              "uvIndex": 7.400000095367432,
              "cloudCover": 73.54166412353516,
              "weatherCode": 95
            },
            {
              "date": "2025-05-10T00:00:00.000Z",
              "temperatureMax": 30.68899917602539,
              "temperatureMin": 21.888999938964844,
              "precipitationProbability": 68,
              "precipitationHours": 18,
              "windSpeed": 0,
              "uvIndex": 8.350000381469727,
              "cloudCover": 95.95833587646484,
              "weatherCode": 95
            }
          ]
        },
        "{\"type\":\"weather\",\"provider\":\"openmeteo\",\"geonames\":{\"outputPath\":\"resources/geonames\",\"dataset\":\"cities15000\"},\"location\":\"Ho Chi Minh City\",\"granularity\":\"daily\",\"forecastDays\":5,\"temperatureUnit\":\"C\"}": {
          "location": "Ho Chi Minh City",
          "reports": [
            {
              "date": "2025-05-06T00:00:00.000Z",
              "temperatureMax": 33.875999450683594,
              "temperatureMin": 25.72599983215332,
              "precipitationProbability": 30,
              "precipitationHours": 5,
              "windSpeed": 0,
              "uvIndex": 8.699999809265137,
              "cloudCover": 70.91666412353516,
              "weatherCode": 95
            },
            {
              "date": "2025-05-07T00:00:00.000Z",
              "temperatureMax": 35.47600173950195,
              "temperatureMin": 25.575998306274414,
              "precipitationProbability": 38,
              "precipitationHours": 5,
              "windSpeed": 0,
              "uvIndex": 9.199999809265137,
              "cloudCover": 83.54166412353516,
              "weatherCode": 80
            },
            {
              "date": "2025-05-08T00:00:00.000Z",
              "temperatureMax": 35.5260009765625,
              "temperatureMin": 25.92599868774414,
              "precipitationProbability": 39,
              "precipitationHours": 4,
              "windSpeed": 0,
              "uvIndex": 8.399999618530273,
              "cloudCover": 73.16666412353516,
              "weatherCode": 80
            },
            {
              "date": "2025-05-09T00:00:00.000Z",
              "temperatureMax": 36.07600021362305,
              "temperatureMin": 26.575998306274414,
              "precipitationProbability": 35,
              "precipitationHours": 7,
              "windSpeed": 0,
              "uvIndex": 9.149999618530273,
              "cloudCover": 68.66666412353516,
              "weatherCode": 95
            },
            {
              "date": "2025-05-10T00:00:00.000Z",
              "temperatureMax": 34.7760009765625,
              "temperatureMin": 26.075998306274414,
              "precipitationProbability": 63,
              "precipitationHours": 16,
              "windSpeed": 0,
              "uvIndex": 7.099999904632568,
              "cloudCover": 91.5,
              "weatherCode": 80
            }
          ]
        }
      };

      return (
        <Story />
      );
    },
  ],
};

export default preview;