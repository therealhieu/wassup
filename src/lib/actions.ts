'use server';

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

import { AppConfig, AppConfigSchema } from '../infrastructure/config.schemas';
import { WidgetProps } from './schemas';
import { logger } from './logger';
import { getWeatherWidgetProps } from '@/features/weather/services/weather.actions';



export async function getAppConfig(): Promise<AppConfig> {
    const filePath = path.resolve(process.cwd(), 'configs', 'wassup.yml');
    const txt = await fs.readFile(filePath, 'utf8');
    const obj = yaml.parse(txt);
    return AppConfigSchema.parse(obj);
}


export async function getIntialWidgetData(config: AppConfig): Promise<Record<string, WidgetProps | null>> {
    const widgets = config.ui.pages.flatMap(page => page.columns.flatMap(column => column.widgets));

    const widgetData = await Promise.all(widgets.map(async (widgetConfig) => {
        switch (widgetConfig.type) {
            case 'weather':
                const weatherWidgetProps = await getWeatherWidgetProps(widgetConfig);
                const key = JSON.stringify(widgetConfig);
                return { [key]: weatherWidgetProps };
            default:
                return { [""]: null };
        }
    }));

    const data = widgetData.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    logger.info(`Got initial widget data for ${Object.keys(data).length} widgets`);
    return data;
}
