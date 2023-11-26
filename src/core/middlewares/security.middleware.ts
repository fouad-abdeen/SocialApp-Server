import * as express from "express";
import helmet from "helmet";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";
import { Service } from "typedi";

/**
 * Adds security middleware (more about helmet here: https://helmetjs.github.io/)
 */
@Middleware({ type: "before" })
@Service()
export class SecurityMiddleware implements ExpressMiddlewareInterface {
  public use(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): unknown {
    return helmet()(req, res, next);
  }
}
