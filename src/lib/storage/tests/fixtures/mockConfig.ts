import { AppConfig } from '@/infrastructure/config.schemas';

export const MOCK_CONFIG_SIMPLE: AppConfig = {
  ui: {
    theme: 'light',
    pages: [
      {
        title: 'Home',
        path: '/',
        columns: [
          {
            size: 12,
            widgets: [
              {
                id: 'weather-1',
                type: 'weather',
                location: 'Ho Chi Minh City',
                columnStart: 1,
                columnSpan: 6,
              }
            ]
          }
        ]
      }
    ]
  }
};

export const MOCK_CONFIG_EXPANDED: AppConfig = {
  ui: {
    theme: 'dark',
    pages: [
      {
        title: 'Home',
        path: '/',
        columns: [
          {
            size: 12,
            widgets: [
              {
                id: 'weather-1',
                type: 'weather',
                location: 'Ho Chi Minh City',
                columnStart: 1,
                columnSpan: 6,
              },
              {
                id: 'bookmark-1',
                type: 'bookmark',
                groups: [
                  {
                    name: 'Development',
                    bookmarks: [
                      { name: 'GitHub', url: 'https://github.com' },
                      { name: 'Supabase', url: 'https://supabase.io' }
                    ]
                  }
                ],
                columnStart: 7,
                columnSpan: 6,
              }
            ]
          }
        ]
      }
    ]
  }
};

export const MOCK_CONFIG_UPDATED: AppConfig = {
  ui: {
    theme: 'light',
    pages: [
      {
        title: 'Home',
        path: '/',
        columns: [
          {
            size: 12,
            widgets: [
              {
                id: 'weather-updated',
                type: 'weather',
                location: 'New York',
                columnStart: 1,
                columnSpan: 12,
              }
            ]
          }
        ]
      }
    ]
  }
};

// Serialized versions for localStorage testing
export const MOCK_CONFIG_SIMPLE_JSON = JSON.stringify({ appConfig: MOCK_CONFIG_SIMPLE });
export const MOCK_CONFIG_EXPANDED_JSON = JSON.stringify({ appConfig: MOCK_CONFIG_EXPANDED });
export const MOCK_CONFIG_UPDATED_JSON = JSON.stringify({ appConfig: MOCK_CONFIG_UPDATED });

// YAML versions for config editor testing
export const MOCK_CONFIG_SIMPLE_YAML = `ui:
  theme: light
  pages:
    - title: Home
      path: /
      columns:
        - size: 12
          widgets:
            - id: weather-1
              type: weather
              location: Ho Chi Minh City
              columnStart: 1
              columnSpan: 6`;

export const MOCK_CONFIG_EXPANDED_YAML = `ui:
  theme: dark
  pages:
    - title: Home
      path: /
      columns:
        - size: 12
          widgets:
            - id: weather-1
              type: weather
              location: Ho Chi Minh City
              columnStart: 1
              columnSpan: 6
            - id: bookmark-1
              type: bookmark
              groups:
                - name: Development
                  bookmarks:
                    - name: GitHub
                      url: https://github.com
                    - name: Supabase
                      url: https://supabase.io
              columnStart: 7
              columnSpan: 6`;