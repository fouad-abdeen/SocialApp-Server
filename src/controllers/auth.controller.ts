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
import { BaseService, Context } from "../core";
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

    response.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: true,
    });

    response.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return UserResponse.getUserResponse(user);
  }
  // #endregion

  // #region Login
  @Post("/login")
  @OpenAPI({
    summary: "Authenticate user",
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

    response.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: true,
    });

    response.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return UserResponse.getUserResponse(user);
  }
  // #endregion

  // #region Logout
  @Authorized()
  @Get("/logout")
  @OpenAPI({
    summary: "Sign out user",
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

    response.cookie("accessToken", "", {
      httpOnly: true,
      secure: true,
      expires: new Date(0),
    });

    response.cookie("refreshToken", "", {
      httpOnly: true,
      secure: true,
      expires: new Date(0),
    });
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

      response.cookie("accessToken", "", {
        httpOnly: true,
        secure: true,
        expires: new Date(0),
      });

      response.cookie("refreshToken", "", {
        httpOnly: true,
        secure: true,
        expires: new Date(0),
      });
    }
  }
  // #endregion

  // #region Get Authenticated User
  @Authorized()
  @Get("/user")
  @OpenAPI({
    summary: "Get authenticated user's info",
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
