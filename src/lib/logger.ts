import { Logger, ILogObj } from "tslog";

// Get log level based on environment
const getLogLevel = () => {
  if (process.env.NODE_ENV === 'development') return 0; // DEBUG
  if (process.env.NODE_ENV === 'test') return 2; // WARN
  return 3; // ERROR for production
};

// Base logger configuration
export const baseLogger: Logger<ILogObj> = new Logger({
  hideLogPositionForProduction: true,
  minLevel: getLogLevel(),
  prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}} {{logLevelName}} [{{name}}] ",
});

// Create specialized loggers for different modules
export const createLogger = (name: string): Logger<ILogObj> => 
  baseLogger.getSubLogger({ name });

// Module-specific loggers
export const logger = baseLogger; // Default logger
export const apiLogger = createLogger('API');
export const storageLogger = createLogger('Storage');  
export const authLogger = createLogger('Auth');
export const dbLogger = createLogger('DB');
export const feedLogger = createLogger('Feed');
export const youtubeLogger = createLogger('YouTube');
export const redditLogger = createLogger('Reddit');
