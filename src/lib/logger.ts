import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors } = format;

// 1) Define a log format
const myFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const base = `${timestamp} [${level}]: ${message}`;
    const err = stack ? `\n${stack}` : '';
    const metaStr = Object.keys(meta).length
        ? `\n\t${JSON.stringify(meta, null, 2)}`
        : '';
    return base + err + metaStr;
});

// 2) Create the logger
export const logger = createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: combine(
        errors({ stack: true }),    // capture stack trace
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        myFormat
    ),
    transports: [
        // Console
        new transports.Console({
            format: combine(
                colorize(),       // colorize in dev
                timestamp(),
                myFormat
            )
        }),
        // (Optional) write all logs to a file
        // new transports.File({ filename: 'logs/app.log' })
    ],
});
