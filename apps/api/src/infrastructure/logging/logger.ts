export interface LoggerOptions {
  level: string;
  service: string;
}

export interface AppLogger {
  debug(event: string, payload?: Record<string, unknown>): void;
  info(event: string, payload?: Record<string, unknown>): void;
  warn(event: string, payload?: Record<string, unknown>): void;
  error(event: string, payload?: Record<string, unknown>): void;
}

const LEVEL_ORDER = ["DEBUG", "INFO", "WARN", "ERROR"] as const;

function shouldLog(currentLevel: string, targetLevel: string): boolean {
  return LEVEL_ORDER.indexOf(targetLevel as (typeof LEVEL_ORDER)[number]) >=
    LEVEL_ORDER.indexOf(currentLevel as (typeof LEVEL_ORDER)[number]);
}

export function createLogger(options: LoggerOptions): AppLogger {
  const level = options.level.toUpperCase();

  function write(targetLevel: string, event: string, payload?: Record<string, unknown>) {
    if (!shouldLog(level, targetLevel)) {
      return;
    }

    console.log(
      JSON.stringify({
        level: targetLevel,
        event,
        service: options.service,
        timestamp: new Date().toISOString(),
        ...payload
      })
    );
  }

  return {
    debug: (event, payload) => write("DEBUG", event, payload),
    info: (event, payload) => write("INFO", event, payload),
    warn: (event, payload) => write("WARN", event, payload),
    error: (event, payload) => write("ERROR", event, payload)
  };
}
