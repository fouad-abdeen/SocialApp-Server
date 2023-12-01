import {
  sign,
  SignOptions,
  TokenExpiredError,
  verify,
  VerifyOptions,
} from "jsonwebtoken";
import { IAuthTokenProvider } from "./auth.interface";
import { BaseService } from "../../base.service";

export class AuthTokenProvider
  extends BaseService
  implements IAuthTokenProvider
{
  private readonly maxExpiryDuration = 172800; // 48 hours in seconds
  private readonly minExpiryDuration = 900; // 15 minutes in seconds
  private readonly secret: string;

  constructor(secret: string) {
    super(__filename);
    this.secret = secret;
  }

  generateToken<T>(payload: T, options: SignOptions): string {
    let token: string;

    // The expiry duration should be at least 15 minutes and at most 48 hours.
    const numberOfSeconds = Math.min(
      this.parseExpiration(options.expiresIn),
      this.maxExpiryDuration
    );

    try {
      token = sign(payload as any, this.secret, {
        ...options,
        // We can set the expiresIn option only if the payload is an object.
        expiresIn:
          typeof payload === "string" || Buffer.isBuffer(payload)
            ? undefined
            : numberOfSeconds,
      });
    } catch (error: any) {
      this._logger.error("Error signing token:", error.message);
      throw new Error(error.message);
    }

    return token;
  }

  verifyToken<T>(
    token: string,
    options?: VerifyOptions,
    skipExpiredError = false
  ): T {
    try {
      return verify(token, this.secret, options) as T;
    } catch (error: any) {
      if (skipExpiredError && error instanceof TokenExpiredError) {
        return null as T;
      }

      this._logger.error("Error verifying token:", error.message);
      throw new Error(error.message);
    }
  }

  private parseExpiration(expiresIn: string | number | undefined): number {
    if (typeof expiresIn === "number" && expiresIn > this.minExpiryDuration)
      return expiresIn;

    if (typeof expiresIn === "string") {
      if (expiresIn.endsWith("m")) return parseInt(expiresIn.slice(0, -1)) * 60;

      if (expiresIn.endsWith("h"))
        return parseInt(expiresIn.slice(0, -1)) * 3600;

      if (expiresIn.endsWith("d"))
        return parseInt(expiresIn.slice(0, -1)) * 86400;

      const numberOfSeconds = parseInt(expiresIn);

      if (!isNaN(numberOfSeconds) && numberOfSeconds > this.minExpiryDuration)
        return numberOfSeconds;
    }

    return this.minExpiryDuration;
  }
}
