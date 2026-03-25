type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  return `[${level.toUpperCase()}] ${message}`;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (isDev) {
      console.debug(formatMessage("debug", message), context ?? "");
    }
  },

  info(message: string, context?: LogContext): void {
    console.info(formatMessage("info", message), context ?? "");
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage("warn", message), context ?? "");
  },

  error(message: string, context?: LogContext): void {
    console.error(formatMessage("error", message), context ?? "");
  },
};
