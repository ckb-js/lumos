export declare const DEFAULT_CKB_DEBUGGER_DIRECTORY_PATH: string;
export interface DownloadDebuggerOptions {
    version?: string;
    dir?: string;
}
export declare class CKBDebuggerDownloader {
    readonly config: Required<DownloadDebuggerOptions>;
    constructor(options?: DownloadDebuggerOptions);
    downloadIfNotExists(): Promise<string>;
    hasDownloaded(): Promise<boolean>;
    getDebuggerPath(): string;
}
