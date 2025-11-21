import Container, { Service } from "typedi";
import { Action } from "routing-controllers";
import {
  AuthHashProvider,
  BaseService,
  Context,
  MailProvider,
  MailTemplateType,
  env,
  throwError,
} from "../core";
import { User } from "../models";
import { UserRepository } from "../repositories";
import { AuthTokenProvider } from "../core/providers/auth/auth-token.provider";
import {
  LoginRequest,
  PasswordUpdateRequest,
  SignupRequest,
} from "../controllers/request";
import { isEmail } from "class-validator";
import {
  AuthPayload,
  AuthResponse,
  AuthTokenObject,
  AuthTokenType,
  AuthTokens,
} from "../shared/auth.types";
@Service()
export class AuthService extends BaseService {
  constructor(
    private _userRepository: UserRepository,
    private _hashService: AuthHashProvider,
    private _tokenService: AuthTokenProvider,
    private _mailService: MailProvider
  ) {
    super(__filename);
    if (!this._hashService) this._hashService = Container.get(AuthHashProvider);
    if (!this._tokenService)
      this._tokenService = Container.get(AuthTokenProvider);
    if (!this._mailService) this._mailService = Container.get(MailProvider);
  }

  async signUpUser(userSignupData: SignupRequest): Promise<null> {
    this.setRequestId();
    this._logger.info(
      `Attempting to sign up user with username ${userSignupData.username}`
    );

    // Validate username format, see: https://stackoverflow.com/a/12019115/8062659
    // The accepted formation is explained in the below error message
    const usernameRegex = /^(?!.*[_.-]{2})[a-zA-Z][a-zA-Z0-9_.-]*[a-zA-Z0-9]$/;

    if (!usernameRegex.test(userSignupData.username))
      throw new Error(
        "Invalid username. It should start with a letter and end with a letter or number, " +
          "contain only letters, numbers, hyphens, underscores, or periods, " +
          "and not have two consecutive underscores, dots, or hyphens."
      );

    // #region Create the User in the Database
    this._logger.info(`Hashing user's password`);
    userSignupData.password = await this._hashService.hashPassword(
      userSignupData.password
    );

    let createdUser = {} as User;

    try {
      createdUser = await this._userRepository.createUser(
        userSignupData as User
      );
    } catch (error: any) {
      // If MongoDB throws a duplicate key error, it means that a user with the same email or username already exists
      if (error.message.split("dup key: { email: ").length > 1) {
        throwError(
          "A user with this email already exists. Please choose a different email.",
          409
        );
      }

      if (error.message.split("dup key: { username: ").length > 1) {
        throwError(
          "A user with this username already exists. Please choose a different username.",
          409
        );
      }
    }
    // #endregion

    // #region Send Email Verification Mail
    const { _id, email, firstName } = createdUser;
    const id = (_id as string).toString();

    const emailVerificationToken =
      this._tokenService.generateToken<AuthPayload>(
        {
          identityId: id,
          email,
          tokenType: AuthTokenType.EMAIL_VERIFICATION_TOKEN,
        },
        { expiresIn: env.auth.emailVerificationTokenExpiresIn }
      );

    this._logger.info(`Sending email verification email to ${email}`);

    await this._mailService.sendMail(
      {
        name: firstName,
        email,
      },
      "Verify your Email",
      this._mailService.parseMailTemplate(MailTemplateType.EMAIL_VERIFICATION, {
        USER_NAME: firstName,
        CALL_TO_ACTION_URL: `${env.frontend.emailVerificationUrl}?token=${emailVerificationToken}`,
      })
    );
    // #endregion

    return null;
  }

  async signOutUser(tokens: AuthTokens): Promise<void> {
    this.setRequestId();
    this._logger.info(
      `Attempting to sign out user by invalidating their tokens`
    );

    let identityId = "",
      accessTokenExpiry = 0,
      refreshTokenExpiry = 0;

    // #region Verify Access Token
    try {
      const {
        identityId: id,
        email,
        exp,
      } = this._tokenService.verifyToken<AuthPayload & { exp: number }>(
        tokens.accessToken
      );

      if (!id || !email) throwError("malformed token", 401);

      identityId = id;
      accessTokenExpiry = exp;
    } catch (error: any) {
      this._logger.error(`Failed to verify access token, ${error.message}`);
    }
    // #endregion

    // #region Verify Refresh Token
    try {
      const { exp } = this._tokenService.verifyToken<
        AuthPayload & { exp: number }
      >(tokens.refreshToken);

      refreshTokenExpiry = exp;
    } catch (error: any) {
      this._logger.error(`Failed to verify refresh token, ${error.message}`);
    }
    // #endregion

    // #region Prepare Denylist
    const denyList = [] as Array<{ token: string; expiresIn: number }>;

    if (accessTokenExpiry)
      denyList.push({
        token: tokens.accessToken,
        expiresIn: accessTokenExpiry,
      });

    if (refreshTokenExpiry)
      denyList.push({
        token: tokens.refreshToken,
        expiresIn: refreshTokenExpiry,
      });
    // #endregion

    if (identityId && denyList.length > 0) {
      this._logger.info("Adding tokens to the user's Denylist");

      const updatedUserData = <unknown>{
        _id: identityId,
        $addToSet: {
          tokensDenylist: {
            $each: denyList,
          },
        },
      };

      await this._userRepository.updateUser(<User>updatedUserData);
    }
  }

  async authenticateUser({
    userIdentifier,
    password,
  }: LoginRequest): Promise<AuthResponse> {
    const usingEmail = isEmail(userIdentifier);

    // #region Get User by Email or Username
    const userIdentifierMessage = usingEmail
      ? "email " + userIdentifier
      : "username " + userIdentifier;

    this.setRequestId();
    this._logger.info(
      `Attempting to authenticate user with ${userIdentifierMessage}`
    );

    this._logger.info(`Verifying user's ${userIdentifierMessage}`);
    const user = usingEmail
      ? await this._userRepository.getUserByEmail(userIdentifier)
      : await this._userRepository.getUserByUsername(userIdentifier);
    // #endregion

    // #region Clear Expired Tokens
    this._logger.info("Clearing user's expired tokens from Denylist");

    // Calculate the current timestamp in seconds (Unix timestamp)
    const currentTimestampInSeconds = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds

    // Filter tokens that have not yet expired
    const updatedtokensDenylist = user.tokensDenylist.filter(
      (token) => token.expiresIn > currentTimestampInSeconds
    );

    // Update the user's tokens denylist in background (non-blocking)
    this._userRepository
      .updateUser({
        _id: user._id,
        tokensDenylist: updatedtokensDenylist,
      } as User)
      .then(() =>
        this._logger.info("Cleared expired tokens from user's denylist")
      )
      .catch((error: any) =>
        this._logger.error(
          `Failed to clear expired tokens for user ${user._id}: ${error.message}`
        )
      );
    //#endregion

    this._logger.info(`Verifying user's password`);
    const passwordMatch = await this._hashService.verifyPassword(
      password,
      user.password
    );

    if (!passwordMatch) throwError("Invalid password", 401);

    // Generate access and refresh tokens
    const tokens = this.getTokens(<AuthPayload>{
      identityId: user._id.toString(),
      email: user.email,
      signedAt: +new Date(),
    });

    return {
      ...user,
      tokens,
    };
  }

  async authorizeUser(action: Action): Promise<void> {
    let user: User;
    const accessToken = action.request.cookies["accessToken"];

    this.setRequestId();
    this._logger.info("Attempting to authorize user");

    // #region Verify Authorization Access Token
    this._logger.info("Verifying authorization access token");

    let payload: AuthPayload | null = null;

    if (accessToken) {
      try {
        payload = this._tokenService.verifyToken<AuthPayload>(accessToken, {});

        if (payload)
          if (payload.tokenType !== AuthTokenType.ACCESS_TOKEN)
            throwError("invalid token", 401);
      } catch (error: any) {
        this._logger.error(`Failed to verify access token, ${error.message}`);
      }
    }

    // If access token is expired, attempt to refresh it
    if (!payload) {
      const refreshToken = action.request.cookies["refreshToken"];
      if (!refreshToken) throwError("No refresh token provided", 401);

      this._logger.info("Attempting to refresh access token");

      try {
        const tokens = this.refreshAccessToken(refreshToken);

        // Set the new access and refresh tokens in the response cookies
        action.response.cookie("accessToken", tokens.accessToken, {
          httpOnly: true,
          secure: true,
        });

        action.response.cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: true,
        });

        // Get the payload from the new access token
        payload = this._tokenService.verifyToken<AuthPayload>(
          tokens.accessToken
        );
      } catch (error: any) {
        this._logger.error(
          "Failed to refresh access token, logging out the user"
        );

        // Clear the cookies as the refresh token is invalid
        action.response.cookie("accessToken", "", {
          httpOnly: true,
          secure: true,
          expires: new Date(0),
        });

        action.response.cookie("refreshToken", "", {
          httpOnly: true,
          secure: true,
          expires: new Date(0),
        });
      }
    }

    user = await this._userRepository.getUserByEmail(payload!.email);
    user._id = (user._id as string).toString();

    // Deny access if the user's password was updated after the access token was issued
    if (
      <number>payload!.signedAt < user.passwordUpdatedAt ||
      user.tokensDenylist.find((object) => object.token === accessToken)
    )
      throwError("Authorization token is not valid anymore", 401);
    // #endregion

    // #region Limit Access to Inactive User Accounts
    const requestUrl = action.request.originalUrl;
    const atLogoutRoute = requestUrl.split("auth/logout").length > 1;
    const atUserQueryRoute = requestUrl.split("auth/user").length > 1;

    // If the user is not verified, allow them to access only the following protected routes:
    // GET /auth/logout
    // GET /auth/user
    if (!user.verified && !atLogoutRoute && !atUserQueryRoute)
      throwError(
        "Your account is inactive. Please verify your email address or contact us to activate your account.",
        403
      );
    // #endregion

    this._logger.info("Setting user in Context");
    Context.setUser(user);
  }

  async verifyEmailAddress(token: string): Promise<void> {
    let id = "",
      email = "",
      tokenExpiry = 0,
      tokensDenylist: AuthTokenObject[] = [];

    this.setRequestId();
    this._logger.info("Attempting to verify email address");

    // #region Verify Token
    try {
      const authPayload = this._tokenService.verifyToken<
        AuthPayload & { exp: number }
      >(token);

      if (authPayload.tokenType !== AuthTokenType.EMAIL_VERIFICATION_TOKEN)
        throwError("invalid token", 401);

      id = authPayload.identityId;
      email = authPayload.email;
      tokenExpiry = authPayload.exp;
    } catch (error) {
      throwError("Failed to verify email address, invalid token", 401);
    }

    try {
      const user = await this._userRepository.getUserByEmail(email);
      tokensDenylist = user.tokensDenylist;

      if (tokensDenylist.find((object) => object.token === token))
        throwError(`token is already used`, 401);
    } catch (error: any) {
      throwError(`Failed to verify email address, ${error.message}`, 401);
    }
    // #endregion

    this._logger.info("Adding email verification token to the user's Denylist");
    const updatedtokensDenylist = [
      ...tokensDenylist,
      { token, expiresIn: tokenExpiry },
    ];

    this._logger.info(`Verifying email address for user with email ${email}`);
    await this._userRepository.updateUser({
      _id: id,
      verified: true,
      tokensDenylist: updatedtokensDenylist,
    } as User);
  }

  async sendPasswordResetLink(email: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Attempting to send password reset link to ${email}`);

    this._logger.info(`Verifying user's email ${email}`);
    const user = await this._userRepository.getUserByEmail(email);

    if (!user.verified) throwError(`${email} is not verified`, 403);

    const id = (user._id as string).toString();
    const name = user.firstName;

    const passwordResetToken = this._tokenService.generateToken<AuthPayload>(
      {
        identityId: id,
        email,
        tokenType: AuthTokenType.PASSWORD_RESET_TOKEN,
      },
      { expiresIn: env.auth.passwordResetTokenExpiresIn }
    );

    this._logger.info(`Sending password reset email to ${email}`);

    await this._mailService.sendMail(
      {
        name,
        email,
      },
      "Reset your password",
      this._mailService.parseMailTemplate(MailTemplateType.PASSWORD_RESET, {
        USER_NAME: name,
        CALL_TO_ACTION_URL: `${env.frontend.passwordResetUrl}?token=${passwordResetToken}`,
      })
    );
  }

  async resetPassword(token: string, password: string): Promise<void> {
    let id = "",
      email = "",
      verified = false,
      tokenExpiry = 0,
      tokensDenylist: AuthTokenObject[] = [];

    this.setRequestId();
    this._logger.info("Attempting to reset password");

    // #region Verify Token
    try {
      const authPayload = this._tokenService.verifyToken<
        AuthPayload & { exp: number }
      >(token);

      if (authPayload.tokenType !== AuthTokenType.PASSWORD_RESET_TOKEN)
        throwError("invalid token", 401);

      id = authPayload.identityId;
      email = authPayload.email;
      tokenExpiry = authPayload.exp;
    } catch (error) {
      throwError("Failed to reset password, invalid token", 401);
    }

    try {
      const user = await this._userRepository.getUserByEmail(email);

      verified = user.verified;
      tokensDenylist = user.tokensDenylist;

      if (tokensDenylist.find((object) => object.token === token))
        throwError(`token is already used`, 401);
    } catch (error: any) {
      throwError(`Failed to reset password, ${error.message}`, 401);
    }
    // #endregion

    if (!verified) throwError(`${email} is not verified`, 403);

    this._logger.info("Adding password reset token to the user's Denylist");
    const updatedtokensDenylist = [
      ...tokensDenylist,
      { token, expiresIn: tokenExpiry },
    ];

    const hashedPassword = await this._hashService.hashPassword(password);

    this._logger.info(`Resetting password for user with email ${email}`);
    await this._userRepository.updateUser({
      _id: id,
      password: hashedPassword,
      passwordUpdatedAt: +new Date(),
      tokensDenylist: updatedtokensDenylist,
    } as User);
  }

  async updatePassword(request: PasswordUpdateRequest): Promise<void> {
    const user = Context.getUser();

    this.setRequestId();
    this._logger.info(
      `Attempting to update password for user with id ${user._id}`
    );

    const passwordMatch = await this._hashService.verifyPassword(
      request.currentPassword,
      user.password
    );
    if (!passwordMatch) throwError("Current password is incorrect", 401);

    const hashedPassword = await this._hashService.hashPassword(
      request.newPassword
    );

    this._logger.info(`Updating password for user with id ${user._id}`);

    await this._userRepository.updateUser({
      _id: user._id,
      password: hashedPassword,
      // If terminateAllSessions is true, update the passwordUpdatedAt field to invalidate all previous sessions
      ...(request.terminateAllSessions
        ? { passwordUpdatedAt: +new Date() }
        : {}),
    } as User);
  }

  private refreshAccessToken(refreshToken: string): AuthTokens {
    let identityId = "",
      email = "",
      tokenExpiry = 0;

    this.setRequestId();
    this._logger.info("Verifying refresh token");

    try {
      const payload = this._tokenService.verifyToken<AuthPayload>(refreshToken);

      if (payload.tokenType !== AuthTokenType.REFRESH_TOKEN)
        throwError("invalid token", 401);

      identityId = payload.identityId;
      email = payload.email;
    } catch (error: unknown) {
      throwError("Failed to verify refresh token", 401);
    }

    this._logger.info(
      `Rotating refresh token to generate new access token for user with email ${email}`
    );

    const updateUserData = <unknown>{
      _id: identityId,
      $addToSet: {
        tokensDenylist: {
          token: refreshToken,
          expiresIn: tokenExpiry,
        },
      },
    };

    // Invalidate the refresh token
    this._userRepository.updateUser(<User>updateUserData);

    // Generate new access and refresh tokens
    const newTokens = this.getTokens(<AuthPayload>{
      identityId,
      email,
      signedAt: +new Date(),
    });

    return newTokens;
  }

  private getTokens(payload: AuthPayload): AuthTokens {
    this.setRequestId();

    this._logger.info("Generating access token");
    const accessToken = this._tokenService.generateToken<AuthPayload>(
      { ...payload, tokenType: AuthTokenType.ACCESS_TOKEN },
      {
        expiresIn: env.auth.accessTokenExpiresIn,
      }
    );

    this._logger.info("Generating refresh token");
    const refreshToken = this._tokenService.generateToken<AuthPayload>(
      { ...payload, tokenType: AuthTokenType.REFRESH_TOKEN },
      {
        expiresIn: env.auth.refreshTokenExpiresIn,
      }
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
