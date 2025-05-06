import { Box, Card, CardContent, Divider, Typography } from '@mui/material';
import { z } from 'zod';

import { DailyWeatherReportListSchema, DailyWeatherReportSchema } from '../domain/entities/daily-weather-report';
import Image from 'next/image';

const weatherIconUrl = "https://openweathermap.org/img/wn/"

const WeatherCodeInfoSchema = z.record(z.coerce.number(), z.object({
    description: z.string(),
    icon: z.string(),
}));
export type WeatherCodeInfo = z.infer<typeof WeatherCodeInfoSchema>;

const WeatherCodeInfo = WeatherCodeInfoSchema.parse({
    0: {
        description: "Clear sky",
        icon: "01d"
    },
    1: {
        description: "Mainly clear",
        icon: "01d"
    },
    2: {
        description: "Partly cloudy",
        icon: "02d"
    },
    3: {
        description: "Overcast",
        icon: "03d"
    },
    45: {
        description: "Foggy",
        icon: "50d"
    },
    48: {
        description: "Depositing rime fog",
        icon: "50d"
    },
    51: {
        description: "Light drizzle",
        icon: "09d"
    },
    53: {
        description: "Moderate drizzle",
        icon: "09d"
    },
    55: {
        description: "Dense drizzle",
        icon: "09d"
    },
    56: {
        description: "Light freezing drizzle",
        icon: "09d"
    },
    57: {
        description: "Dense freezing drizzle",
        icon: "09d"
    },
    61: {
        description: "Slight rain",
        icon: "10d"
    },
    63: {
        description: "Moderate rain",
        icon: "10d"
    },
    65: {
        description: "Heavy rain",
        icon: "10d"
    },
    66: {
        description: "Light freezing rain",
        icon: "13d"
    },
    67: {
        description: "Heavy freezing rain",
        icon: "13d"
    },
    71: {
        description: "Slight snow fall",
        icon: "13d"
    },
    73: {
        description: "Moderate snow fall",
        icon: "13d"
    },
    75: {
        description: "Heavy snow fall",
        icon: "13d"
    },
    77: {
        description: "Snow grains",
        icon: "13d"
    },
    80: {
        description: "Slight rain showers",
        icon: "10d"
    },
    81: {
        description: "Moderate rain showers",
        icon: "10d"
    },
    82: {
        description: "Violent rain showers",
        icon: "10d"
    },
    85: {
        description: "Slight snow showers",
        icon: "13d"
    },
    86: {
        description: "Heavy snow showers",
        icon: "13d"
    },
    95: {
        description: "Slight or moderate thunderstorm",
        icon: "11d"
    },
    96: {
        description: "Thunderstorm with slight hail",
        icon: "11d"
    },
    99: {
        description: "Thunderstorm with heavy hail",
        icon: "11d"
    }
});


export const WeatherIconPropsSchema = z.object({
    weatherCode: z.number(),
    size: z.number().optional().default(1),
    style: z.object({}).optional(),
});
export type WeatherIconProps = z.infer<typeof WeatherIconPropsSchema>;

const WeatherIcon = ({ weatherCode, size, style }: WeatherIconProps) => {
    const iconPath = size == 1 ? `${WeatherCodeInfo[weatherCode].icon}.png` : `${WeatherCodeInfo[weatherCode].icon}@${size}x.png`;

    return <Image
        src={`${weatherIconUrl}${iconPath}`}
        alt={WeatherCodeInfo[weatherCode].description}
        style={{ ...style }}
        width={128}
        height={128}
    />;
};

export const TodayWeatherPropsSchema = z.object({
    location: z.string(),
    report: DailyWeatherReportSchema,
});
export type TodayWeatherProps = z.infer<typeof TodayWeatherPropsSchema>;


const TodayWeather = ({ location, report }: TodayWeatherProps) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" component="div">
                    {report.date.toLocaleDateString()} - {location}
                </Typography>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ my: 2 }}>
                        <div style={{ alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <WeatherIcon size={4} weatherCode={report.weatherCode} style={{ width: 156, height: 156 }} />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 1,
                                        width: '100%',
                                        backgroundColor: 'transparent',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Typography>
                                        {Math.round(report.temperatureMax)}°C | {Math.round(report.temperatureMin)}°C
                                    </Typography>
                                </div>
                            </div>
                        </div>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        fontSize: {
                            xs: '0.75rem',
                            sm: '0.875rem',
                            md: '1rem'
                        }
                    }}>
                        <span>precip: {Math.round(report.precipitationProbability)}%</span>
                        <span>precip hrs: {Math.round(report.precipitationHours)}</span>
                        <span>cloud: {Math.round(report.cloudCover)}%</span>
                        <span>uv: {Math.round(report.uvIndex)}</span>
                        <span>wind: {Math.round(report.windSpeed)} km/h</span>
                    </Typography>
                </div>
            </CardContent>
        </Card>
    );
};

export const ForecastWeatherPropsSchema = z.object({
    location: z.string(),
    reports: DailyWeatherReportListSchema,
});
export type ForecastWeatherProps = z.infer<typeof ForecastWeatherPropsSchema>;

const ForecastWeather = ({ reports }: ForecastWeatherProps) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" component="div">
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-around' }}>
                        {reports.map((report) => (
                            <div key={report.date.toISOString()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography variant="body2">{report.date.toLocaleDateString(undefined, { weekday: 'short' })}</Typography>
                                <WeatherIcon size={1} weatherCode={report.weatherCode} style={{ width: 48, height: 48 }} />
                                <Typography variant='body2' sx={{ fontSize: '0.65rem' }}>{Math.round(report.temperatureMax)}°C | {Math.round(report.temperatureMin)}°C</Typography>
                            </div>
                        ))}
                    </div>
                </Typography>
            </CardContent>
        </Card>
    );
};

export const WeatherWidgetPropsSchema = z.object({
    location: z.string(),
    reports: DailyWeatherReportListSchema,
});
export type WeatherWidgetProps = z.infer<typeof WeatherWidgetPropsSchema>;

export const WeatherWidget = ({ location, reports }: WeatherWidgetProps) => {
    const todayReport = reports[0];
    const forecastReports = reports.slice(1);
    return (
        <Card sx={{ width: '100%' }}>
            <Box sx={{ border: 'none' }}>
                <TodayWeather location={location} report={todayReport} />
            </Box>
            <Divider />
            <Box sx={{ pt: 0, borderTop: 'none' }}>
                <ForecastWeather location={location} reports={forecastReports} />
            </Box>
        </Card>
    );
};

