import {
  Authorized,
  Body,
  Delete,
  Get,
  JsonController,
  Patch,
  Post,
  QueryParam,
  QueryParams,
  UploadedFile,
} from "routing-controllers";
import { Service } from "typedi";
import { BaseService, Context, FileUpload, throwError } from "../core";
import { UserRepository } from "../repositories";
import {
  UploadAvatarResponse,
  UserProfileResponse,
  UserResponse,
  UserSearchResponse,
} from "./response";
import { Pagination } from "../types";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { UserService } from "../services";
import { FollowingQueryParams, ProfileEditRequest } from "./request";
import { User } from "../models";

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
  @Post("/follow")
  @OpenAPI({
    summary: "Follow a user",
  })
  async followUser(
    @QueryParams() { followingId }: FollowingQueryParams
  ): Promise<void> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(
      `Received a follow request from ${userId} to ${followingId}`
    );

    await this._userService.followUser(userId, followingId);
  }
  // #endregion

  // #region Unfollow user
  @Authorized()
  @Post("/unfollow")
  @OpenAPI({
    summary: "Unfollow a user",
  })
  async unfollowUser(
    @QueryParams() { followingId }: FollowingQueryParams
  ): Promise<void> {
    const userId = Context.getUser()._id;

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
  })
  @ResponseSchema(UserSearchResponse, { isArray: true })
  async getFollowers(
    @QueryParams() pagination: Pagination
  ): Promise<UserSearchResponse[]> {
    const user = Context.getUser();

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
  })
  @ResponseSchema(UserSearchResponse, { isArray: true })
  async getFollowings(
    @QueryParams() pagination: Pagination
  ): Promise<UserSearchResponse[]> {
    const user = Context.getUser();

    this.setRequestId();
    this._logger.info(`Getting followings for user with id: ${user._id}`);

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
  })
  @ResponseSchema(UploadAvatarResponse)
  async uploadAvatar(
    @UploadedFile("avatar", {
      required: true,
    })
    avatar: FileUpload
  ): Promise<UploadAvatarResponse> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(`Received an upload avatar request from ${userId}`);

    const fileKey = await this._userService.uploadAvatar(userId, avatar);

    return { fileKey };
  }
  // #endregion

  // #region Delete avatar
  @Authorized()
  @Delete("/avatar")
  @OpenAPI({
    summary: "Delete avatar",
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
  })
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
