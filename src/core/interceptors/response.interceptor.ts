import { Service as service } from "typedi";
import { Interceptor, InterceptorInterface, Action } from "routing-controllers";

/**
 * Intercepts the responses and standardizes the format of the response
 * Format: status + data
 */
@Interceptor()
@service()
export class ResponseInterceptor implements InterceptorInterface {
  intercept(action: Action, content: unknown) {
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
