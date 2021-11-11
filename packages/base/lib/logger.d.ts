export type LogLevel = "warn" | "error" | string;
// Indexer
export type Logger = (level: LogLevel, message: string) => void;
export type Log = (message: string) => void;
export function deprecated(message: string): void;
