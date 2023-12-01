import { Request, Response } from "express";
import * as httpContext from "express-http-context";
import { Service } from "typedi";
import { User } from "../models";

enum CONTEXT_VALUES {
  REQUEST_ID = "request-id",
  USER = "user",
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
   * @param user user object that will be set in http context
   * @memberof Context
   */
  public static setUser(user: User): void {
    httpContext.set(CONTEXT_VALUES.USER, user);
  }

  /**
   *
   * @static
   * @returns user which is present in http context
   * @memberof Context
   */
  public static getUser(): User {
    return httpContext.get(CONTEXT_VALUES.USER);
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
