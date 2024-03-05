import { Service as service } from "typedi";
import { Interceptor, InterceptorInterface, Action } from "routing-controllers";
import { env } from "../config";

/**
 * Intercepts the responses and standardizes the format of the response
 * Format: status + data
 */
@Interceptor()
@service()
export class ResponseInterceptor implements InterceptorInterface {
  intercept(action: Action, content: unknown) {
    action.response.header("Access-Control-Allow-Origin", env.frontend.url);
    return new Response<unknown>(content);
  }
}

/**
 * Success response
 */
class Response<T> {
  public status: "success";
  public data: T;

  constructor(data: T) {
    this.status = "success";
    this.data = data;
  }
}
