import compression from "compression";
import * as express from "express";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";
import { Service } from "typedi";

/**
 * Compress the responses
 */
@Middleware({ type: "before" })
@Service()
export class CompressionMiddleware implements ExpressMiddlewareInterface {
  public use(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): unknown {
    return compression()(req, res, next);
  }
}
