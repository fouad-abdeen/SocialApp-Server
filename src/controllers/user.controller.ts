import {
  Authorized,
  Body,
  BodyParam,
  Delete,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
  QueryParam,
  QueryParams,
  UploadedFile,
} from "routing-controllers";
import { Service } from "typedi";
import { BaseService, Context, FileUpload, env, throwError } from "../core";
import { UserRepository } from "../repositories";
import {
  UploadAvatarResponse,
  UserProfileResponse,
  UserResponse,
  UserSearchResponse,
} from "./response";
import { Pagination } from "../shared/pagination.model";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { UserService } from "../services";
import { ProfileEditRequest } from "./request";
import { User } from "../models";
import { isMongoId } from "class-validator";

@JsonController("/users")
@Service()
export class UserController extends BaseService {
  constructor(
    private _userRepository: UserRepository,
    private _userService: UserService
  ) {
    super(__filename);
  }

  // #region Search for users by username
  @Authorized()
  @Get("/search")
  @OpenAPI({
    summary: "Search for users by username",
    description: `
    usernameQuery: query to search for users by username.
    limit: limit of documents to return, default is 5.
    lastDocumentId: id of the last document in the previous page, if not provided, it will return the first page.`,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(UserSearchResponse, { isArray: true })
  async searchUsersByUsername(
    @QueryParam("usernameQuery", { required: true }) usernameQuery: string,
    @QueryParams() pagination: Pagination
  ): Promise<UserSearchResponse[]> {
    this.setRequestId();
    this._logger.info(
      `Searching for users with username matching: ${usernameQuery}`
    );

    const users = await this._userRepository.searchUsersByUsername(
      usernameQuery,
      pagination
    );

    return UserSearchResponse.getUserSearchResponse(users);
  }
  // #endregion

  // #region Get user by username
  @Authorized()
  @Get("/")
  @OpenAPI({
    summary: "Get user by username",
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(UserResponse)
  async getUserByUsername(
    @QueryParam("username", { required: true }) username: string
  ): Promise<UserProfileResponse> {
    this.setRequestId();
    this._logger.info(`Getting user with username: ${username}`);

    const user = await this._userRepository.getUserByUsername(username);

    if (!user) throwError(`User with username ${username} not found`, 404);

    return UserProfileResponse.getUserProfileResponse(user);
  }

  // #endregion

  // #region Follow user
  @Authorized()
  @Post("/:id/follow")
  @OpenAPI({
    summary: "Follow a user",
    security: [{ bearerAuth: [] }],
  })
  async followUser(@Param("id") followingId: string): Promise<void> {
    const userId = Context.getUser()._id;

    if (!isMongoId(followingId))
      throwError(`Invalid user id: ${followingId}`, 400);

    this.setRequestId();
    this._logger.info(
      `Received a follow request from ${userId} to ${followingId}`
    );

    await this._userService.followUser(userId, followingId);
  }
  // #endregion

  // #region Unfollow user
  @Authorized()
  @Post("/:id/unfollow")
  @OpenAPI({
    summary: "Unfollow a user",
    security: [{ bearerAuth: [] }],
  })
  async unfollowUser(@Param("id") followingId: string): Promise<void> {
    const userId = Context.getUser()._id;

    if (!isMongoId(followingId))
      throwError(`Invalid user id: ${followingId}`, 400);

    this.setRequestId();
    this._logger.info(
      `Received an unfollow request from ${userId} to ${followingId}`
    );

    await this._userService.unfollowUser(userId, followingId);
  }
  // #endregion

  // #region Get list of followers
  @Authorized()
  @Get("/followers")
  @OpenAPI({
    summary: "Get list of followers",
    description: `
    userId: id of the user to get followers for, if not provided, it will return the current user's followers.
    limit: limit of documents to return, default is 5.
    lastDocumentId: id of the last document in the previous page, if not provided, it will return the first page.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(UserSearchResponse, { isArray: true })
  async getFollowers(
    @QueryParam("userId") userId: string,
    @QueryParams() pagination: Pagination
  ): Promise<UserSearchResponse[]> {
    let user = userId ? <User>{ _id: userId } : Context.getUser();

    if (!isMongoId(user._id)) throwError("Invalid user id", 400);

    if (!user.followers) {
      const foundUser = await this._userRepository.getUserById(
        userId,
        "followers"
      );
      user.followers = foundUser.followers;
    }

    this.setRequestId();
    this._logger.info(`Getting followers for user with id: ${user._id}`);

    const users = await this._userRepository.getlistOfUsersByIds(
      user.followers,
      pagination
    );

    return UserSearchResponse.getUserSearchResponse(users);
  }
  // #endregion

  // #region Get list of followings
  @Authorized()
  @Get("/followings")
  @OpenAPI({
    summary: "Get list of followings",
    description: `
    userId: id of the user to get followings for, if not provided, it will return the current user's followings.
    limit: limit of documents to return, default is 5.
    lastDocumentId: id of the last document in the previous page, if not provided, it will return the first page.
      `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(UserSearchResponse, { isArray: true })
  async getFollowings(
    @QueryParam("userId") userId: string,
    @QueryParams() pagination: Pagination
  ): Promise<UserSearchResponse[]> {
    let user = userId ? <User>{ _id: userId } : Context.getUser();

    if (!isMongoId(user._id)) throwError("Invalid user id", 400);

    this.setRequestId();
    this._logger.info(`Getting followings for user with id: ${user._id}`);

    if (!user.followings) {
      const foundUser = await this._userRepository.getUserById(
        userId,
        "followings"
      );
      user.followings = foundUser.followings;
    }

    const users = await this._userRepository.getlistOfUsersByIds(
      user.followings,
      pagination
    );

    return UserSearchResponse.getUserSearchResponse(users);
  }
  // #endregion

  // #region Update avatar
  @Authorized()
  @Post("/avatar")
  @OpenAPI({
    summary: "Update avatar",
    description: `
    Update avatar by uploading a new profile picture.
    This API endpoint is not supported here. Follow the below steps to submit a succesful request using Postman:
     1. Open Postman and create a new HTTP Post request.
     2. Enter the following url: '${env.app.schema}://${env.app.host}:${env.app.port}/users/avatar'.
     3. Set the body as form-data and add a field with the key 'avatar' of type File.
     4. Select the file to upload as a profile picture.
     5. Submit the request to update the avatar.
    Maximum file size is 0.5 MB and allowed types are jpg, jpeg, and png.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(UploadAvatarResponse)
  async uploadAvatar(
    @UploadedFile("avatar", {
      required: true,
    })
    avatar: FileUpload
  ): Promise<UploadAvatarResponse> {
    const user = Context.getUser();

    this.setRequestId();
    this._logger.info(`Received an upload avatar request from ${user._id}`);

    const fileId = await this._userService.uploadAvatar(user, avatar);

    return { fileId };
  }
  // #endregion

  // #region Delete avatar
  @Authorized()
  @Delete("/avatar")
  @OpenAPI({
    summary: "Delete avatar",
    security: [{ bearerAuth: [] }],
  })
  async deleteAvatar(): Promise<void> {
    const user = Context.getUser();

    this.setRequestId();
    this._logger.info(`Received a delete avatar request from ${user._id}`);

    await this._userService.deleteAvatar(user);
  }
  // #endregion

  // #region Edit profile
  @Authorized()
  @Patch("/profile")
  @OpenAPI({
    summary: "Edit profile",
    description: `
    First name, last name, and bio are optional.
    Maximum length for first name and last name is 50 characters.
    Maximum length for bio is 200 characters.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(UserProfileResponse)
  async updateProfile(
    @Body() data: ProfileEditRequest
  ): Promise<UserProfileResponse> {
    const { _id } = Context.getUser();

    this.setRequestId();
    this._logger.info(`Received an edit profile request from ${_id}`);

    const query = <unknown>{
      _id,
      ...data,
    };

    const updatedUser = await this._userRepository.updateUser(<User>query);

    return UserProfileResponse.getUserProfileResponse(updatedUser);
  }
  // #endregion
}
