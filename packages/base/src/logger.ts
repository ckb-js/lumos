export type LogLevel = "warn" | "error" | string;
// Indexer
export type Logger = (level: LogLevel, message: string) => void;
export type Log = (message: string) => void;

export function defaultLogger(level: LogLevel, message: string): void {
  const outputMessage = `[${level}] ${message}`;

  if (level === "error") return console.warn(outputMessage);
  if (level === "warn") return console.warn(outputMessage);

  console.log(`[${level}] ${message}`);
}

export function deprecated(message: string): void {
  defaultLogger("deprecated", message);
}
