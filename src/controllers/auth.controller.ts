import {
  Authorized,
  Body,
  Get,
  JsonController,
  Post,
  Put,
  QueryParam,
  Req,
  Res,
} from "routing-controllers";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { Service } from "typedi";
import { BaseService, Context, env } from "../core";
import { AuthService } from "../services";
import {
  LoginRequest,
  PasswordResetRequest,
  PasswordUpdateRequest,
  SignupRequest,
} from "./request";
import { UserResponse } from "./response";
import { Request, Response } from "express";

@JsonController("/auth")
@Service()
export class AuthController extends BaseService {
  constructor(private _authService: AuthService) {
    super(__filename);
  }

  // #region Signup
  @Post("/signup")
  @OpenAPI({
    summary: "Sign up user",
    description: `
    Registers a user with given credentials and sends a verification email that is valid for 24 hours. 
    It also auto-authenticates the user by generating and setting access and refresh tokens as cookies. 
    Unverified users can only access /auth/logout and /auth/user out of the protected endpoints.
    Body parameters criteria are as follows:
      Username: 2 to 20 characters, unique, and follow the specified format:
        * Starts with a letter and ends with a letter or number.
        * Contains only letters, numbers, hyphens, underscores, or periods.
        * Does not contain consecutive hyphens, underscores, or periods.
      Password: Minimum 8 characters, Should contain at least:
        * One uppercase letter.
        * One lowercase letter.
        * One number.
        * One special character.
      Email: Must be a valid and unique email address.
      First name: Up to 50 characters.
      Last name: Up to 50 characters.
    `,
  })
  @ResponseSchema(UserResponse)
  async signup(
    @Body({ required: true }) signupRequest: SignupRequest,
    @Res() response: Response
  ): Promise<UserResponse> {
    this.setRequestId();
    this._logger.info(
      `Requesting signup for user with username ${signupRequest.username}`
    );

    const signupResponse = await this._authService.signUpUser(signupRequest);
    const { tokens, ...user } = signupResponse;

    response.status(201);
    response.setHeader("Set-Cookie", [
      `accessToken=${tokens.accessToken}; HttpOnly; Secure; SameSite=None;`,
      `refreshToken=${tokens.refreshToken}; HttpOnly; Secure; SameSite=None;`,
    ]);

    return UserResponse.getUserResponse(user);
  }
  // #endregion

  // #region Login
  @Post("/login")
  @OpenAPI({
    summary: "Authenticate user",
    description: `
    Authenticates a user using either a username or email. This generates access and refresh tokens, set as cookies. 
    Users have limited access until email verification.  
    Access tokens are verified on protected endpoint access. 
      Access token expires in 15 minutes and refresh token expires in 24 hours.
      Expired access tokens trigger refresh token rotation and new access token generation.
      Inactivity for 24 hours triggers automatic logout.
    `,
  })
  @ResponseSchema(UserResponse)
  async login(
    @Body({ required: true }) loginRequest: LoginRequest,
    @Res() response: Response
  ): Promise<UserResponse> {
    this.setRequestId();
    this._logger.info(
      `Requesting login for user with the identifier ${loginRequest.userIdentifier}`
    );

    const authResponse = await this._authService.authenticateUser(loginRequest);
    const { tokens, ...user } = authResponse;

    response.status(200);
    response.setHeader("Set-Cookie", [
      `accessToken=${tokens.accessToken}; HttpOnly; Secure; SameSite=None;`,
      `refreshToken=${tokens.refreshToken}; HttpOnly; Secure; SameSite=None;`,
    ]);

    return UserResponse.getUserResponse(user);
  }
  // #endregion

  // #region Logout
  @Authorized()
  @Get("/logout")
  @OpenAPI({
    summary: "Sign out user",
    description: `
    Signs out a user by invalidating the access and refresh tokens.
    Tokens are invalidated by adding them to the token denylist and clearing the cookies.
    `,
    security: [{ bearerAuth: [] }],
  })
  async logout(
    @Req() request: Request,
    @Res() response: Response
  ): Promise<void> {
    this.setRequestId();
    this._logger.info("Requesting user logout");

    const accessToken = <string>request.cookies["accessToken"],
      refreshToken = <string>request.cookies["refreshToken"];

    await this._authService.signOutUser({ accessToken, refreshToken });

    response.status(200);
    response.setHeader("Set-Cookie", [
      `accessToken=; HttpOnly; Secure; SameSite=None; Expires=${new Date(0)};`,
      `refreshToken=; HttpOnly; Secure; SameSite=None; Expires=${new Date(0)};`,
    ]);
  }
  // #endregion

  // #region Verify Email Address
  @Put("/email/verify")
  @OpenAPI({
    summary: "Verify email address",
  })
  async verifyEmail(@QueryParam("token") token: string): Promise<void> {
    this.setRequestId();
    this._logger.info("Requesting email address verification");

    await this._authService.verifyEmailAddress(token);
  }
  // #endregion

  // #region Request Password Reset
  @Get("/password")
  @OpenAPI({
    summary: "Send password reset link",
    description: `
    Sends a password reset link to the user's email address.
    The link is valid for 6 hours.
    `,
  })
  async requestPasswordReset(
    @QueryParam("email") email: string
  ): Promise<void> {
    this.setRequestId();
    this._logger.info(
      `Requesting password reset token for user with email ${email}`
    );

    await this._authService.sendPasswordResetLink(email);
  }
  // #endregion

  // #region Reset Password
  @Post("/password")
  @OpenAPI({
    summary: "Reset user's password",
    description: `
    Resets a user's password using the password reset token. All sessions are terminated after password reset.
    `,
  })
  async resetPassword(
    @Body() { token, password }: PasswordResetRequest
  ): Promise<void> {
    this.setRequestId();
    this._logger.info("Requesting password reset");

    await this._authService.resetPassword(token, password);
  }
  // #endregion

  // #region Update Password
  @Authorized()
  @Put("/password")
  @OpenAPI({
    summary: "Update user's password",
    description: `
    Updates a user's password and terminates all sessions if terminateAllSessions is true.
    `,
    security: [{ bearerAuth: [] }],
  })
  async updatePassword(
    @Body() passwordUpdateRequest: PasswordUpdateRequest,
    @Res() response: Response
  ): Promise<void> {
    this.setRequestId();
    this._logger.info("Requesting password update");

    await this._authService.updatePassword(passwordUpdateRequest);

    if (passwordUpdateRequest.terminateAllSessions) {
      response.status(200);
      response.setHeader("Set-Cookie", [
        `accessToken=; HttpOnly; Secure; SameSite=None; Expires=${new Date(
          0
        )};`,
        `refreshToken=; HttpOnly; Secure; SameSite=None; Expires=${new Date(
          0
        )};`,
      ]);
    }
  }
  // #endregion

  // #region Get Authenticated User
  @Authorized()
  @Get("/user")
  @OpenAPI({
    summary: "Get authenticated user's info",
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(UserResponse)
  async getAuthenticatedUser(): Promise<UserResponse> {
    const user = Context.getUser();

    this.setRequestId();
    this._logger.info(
      `Received a request to get info of the user with id: ${user._id}`
    );

    return UserResponse.getUserResponse(user);
  }
  // #endregion
}
