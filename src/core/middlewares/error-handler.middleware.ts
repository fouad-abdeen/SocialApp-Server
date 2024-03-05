import * as express from "express";
import {
  ExpressErrorMiddlewareInterface,
  Middleware,
} from "routing-controllers";
import { Service } from "typedi";
import { Logger, env } from "..";

/**
 * Catches all errors, logs them, and formats the responses
 */
@Middleware({ type: "after" })
@Service()
export class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
  private isProduction = env.nodeEnv === "production";

  constructor(private _logger) {
    this._logger = new Logger(__filename);
  }

  public error(
    error: Error & { httpCode: number },
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void {
    // Set requestId of logger to keep track of request
    this.setLogger(req);

    const isValidationError =
      error.message.split("check 'errors' property").length > 1;

    // Set class-validator error message
    if (isValidationError)
      error.message =
        (Object.values(error["errors"][0]["constraints"])[0] as string) ||
        error.message;

    res.setHeader("Access-Control-Allow-Origin", env.frontend.url);
    
    res.status(error.httpCode || 500).json(
      new ErrorResponse({
        name: error.name,
        message: error.message,
      })
    );

    // Log error
    if (this.isProduction) {
      this._logger.error(`Error Name: ${error["name"]}`);
      this._logger.error(`Error Message: ${error["message"]}`);
    } else {
      this._logger.error(`Error Name: ${error["name"]}`);
      if (isValidationError)
        this._logger.error(`Class Validator Errors: ${error["message"]}`);
      this._logger.error(`Error Stack: ${error["stack"]}`);
    }
  }

  /**
   * Resets the request of the logger.
   * Context is lost after an exception. That's why we keep the requestId as part of the express request as well.
   * @param req express request
   */
  private setLogger(req: express.Request) {
    const requestId = req.headers["requestId"]
      ? req.headers["requestId"].toString()
      : "";

    this._logger.setRequestId(requestId);
  }
}

/**
 * Error Response
 */
class ErrorResponse {
  public status: "error";
  public error: MyError;

  constructor(error: MyError) {
    this.status = "error";
    this.error = error;
  }
}

type MyError = Error & { errors?: Error[] };
