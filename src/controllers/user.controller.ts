import {
  Authorized,
  Get,
  JsonController,
  Post,
  QueryParam,
  QueryParams,
} from "routing-controllers";
import { Service } from "typedi";
import { BaseService, Context, throwError } from "../core";
import { UserRepository } from "../repositories";
import { UserSearchResponse } from "./response";
import { Pagination } from "../types";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { UserService } from "../services";
import { isMongoId } from "class-validator";
import { FollowingQueryParams } from "./request";

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

    this._logger.info(
      `Received an unfollow request from ${userId} to ${followingId}`
    );

    await this._userService.unfollowUser(userId, followingId);
  }
  // #endregion
}
