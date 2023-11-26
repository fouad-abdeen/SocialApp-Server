import { Request, Response } from "express";
import * as httpContext from "express-http-context";
import { Service } from "typedi";

enum CONTEXT_VALUES {
  REQUEST_ID = "request-id",
}

/**
 * Context is a class used to save the main parameters used throughout a request (requestId, logged in user, etc.)
 */
@Service()
export class Context {
  setContext(req: Request, res: Response, requestId: string): void {
    httpContext.ns.bindEmitter(req);
    httpContext.ns.bindEmitter(res);
    httpContext.set(CONTEXT_VALUES.REQUEST_ID, requestId);
  }

  /**
   *
   * @static
   * @returns requestId which is present in http context
   * @memberof Context
   */
  public static getRequestId(): string {
    return httpContext.get(CONTEXT_VALUES.REQUEST_ID);
  }
}
