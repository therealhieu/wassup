import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { AppConfig } from './schemas';
import { AppConfigSchema } from './schemas';


export async function getAppConfig(): Promise<AppConfig> {
    const filePath = path.resolve(process.cwd(), 'configs', 'wassup.yml');
    const txt = await fs.readFile(filePath, 'utf8');
    const obj = yaml.parse(txt);
    return AppConfigSchema.parse(obj);
}
