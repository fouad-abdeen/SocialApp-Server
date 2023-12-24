import { User } from "../models";

export enum AuthTokenType {
  ACCESS_TOKEN = "Access Token",
  REFRESH_TOKEN = "Refresh Token",
  EMAIL_VERIFICATION_TOKEN = "Email Verification Token",
  PASSWORD_RESET_TOKEN = "Password Reset Token",
}

export class AuthTokenObject {
  token: string;
  expiresIn: number;
}

export class AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthPayload {
  identityId: string;
  email: string;
  tokenType: AuthTokenType;
  signedAt?: number;
}

export type AuthResponse = User & { tokens: AuthTokens };
