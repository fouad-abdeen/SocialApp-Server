import { Context, Logger } from ".";

/**
 * Base Service Class.
 * Exposes the logger to any service that extends it.
 */
export abstract class BaseService {
  protected _logger: Logger;

  constructor(filename: string, logger?: Logger) {
    this._logger = logger ?? new Logger(filename);
  }

  setRequestId(): void {
    this._logger.setRequestId(Context.getRequestId());
  }
}
