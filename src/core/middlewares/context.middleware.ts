import { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";
import { Context } from "..";
import { env } from "..";
import { Service } from "typedi";
import { Logger } from "..";
import { nanoid } from "nanoid";

/**
 * Creates a unique request id and sets the context
 * We also bind here the morgan logger
 */
@Middleware({ type: "before" })
@Service()
export class ContextMiddleware implements ExpressMiddlewareInterface {
  private _logger: Logger;

  constructor(private _context: Context) {
    this._logger = new Logger(__filename);
  }

  public use(req: Request, res: Response, next: NextFunction): unknown {
    let requestId = "";

    if (req.headers["request-id"]) {
      // Set the request id to the incoming header
      requestId = <string>req.headers["request-id"];
    } else {
      // Create a new request id and set the header
      requestId = nanoid();
      req.headers["requestId"] = requestId;
    }

    // Set context
    this._context.setContext(req, res, requestId);
    this._logger.setRequestId(requestId);

    // Bind logger
    return morgan(env.log.output, {
      stream: {
        write: this._logger.info.bind(this._logger),
      },
    })(req, res, next);
  }
}
