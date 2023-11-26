import winston from "winston";
import { env } from ".";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "cyan",
  debug: "green",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
  }),
  new winston.transports.File({ filename: "logs/all.log" }),
];

export const defaultLogger = winston.createLogger({
  level: env.log.level,
  levels,
  format,
  transports,
});

export class Logger {
  public static DEFAULT_SCOPE = "app";

  private _scope: string;
  private _requestId?: string;

  constructor(scope?: string, requestId?: string) {
    this._scope = scope ?? Logger.DEFAULT_SCOPE;
    this._requestId = requestId;
  }

  public debug(message: string, ...args: unknown[]): void {
    this.log("debug", message, args);
  }

  public info(message: string, ...args: unknown[]): void {
    this.log("info", message, args);
  }

  public warn(message: string, ...args: unknown[]): void {
    this.log("warn", message, args);
  }

  public error(message: string, ...args: unknown[]): void {
    this.log("error", message, args);
  }

  public setRequestId(requestId: string) {
    this._requestId = requestId;
  }

  public setScope(scope: string) {
    this._scope = scope;
  }

  private log(level: string, message: string, args: unknown[]): void {
    defaultLogger.log(level, `${this.formatHeader()} ${message}`, args);
  }

  private formatHeader(): string {
    let header = `${this._scope}`;

    if (this._requestId) {
      header += ` -- Request Id ${this._requestId}:`;
    }
    return header;
  }
}
