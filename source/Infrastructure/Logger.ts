export interface LogFunction {
    (message: string, ...args: {}[]): void;
    (obj: object, message?: string, ...args: {}[]): void;
}

export interface Logger {
    error: LogFunction;
    warn: LogFunction;
    info: LogFunction;
    debug: LogFunction;
    trace: LogFunction;

    level: string;
}
