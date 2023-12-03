import { Service } from "typedi";
import { BaseService, throwError } from "../core";
import { UserRepository } from "../repositories";
import { User } from "../models";

@Service()
export class UserService extends BaseService {
  constructor(private _userRepository: UserRepository) {
    super(__filename);
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    this._logger.info(
      `Attempting to add ${followingId} to ${followerId}'s followings list`
    );

    if (followerId === followingId) throwError(`Invalid follow request`, 400);

    // #region Add the following to the follower's followings list
    try {
      const followerQuery = <unknown>{
        _id: followerId,
        $addToSet: { followings: followingId },
      };

      await this._userRepository.updateUser(<User>followerQuery);
    } catch (error: unknown) {
      this._logger.error(
        `Error adding ${followingId} to ${followerId}'s followings list`
      );

      throwError(`Failed to add the user to your followings list`, 400);
    }
    // #endregion

    // #region Add the follower to the following's followers list
    try {
      const followingQuery = <unknown>{
        _id: followingId,
        $addToSet: { followers: followerId },
      };

      await this._userRepository.updateUser(<User>followingQuery);
    } catch (error: unknown) {
      this._logger.error(
        `Error adding ${followerId} to ${followingId}'s followers list`
      );

      this._logger.info(
        `Removing ${followingId} from ${followerId}'s followings list`
      );

      const followerQuery = <unknown>{
        _id: followerId,
        $pull: { followings: followingId },
      };

      await this._userRepository.updateUser(<User>followerQuery);

      throwError(`Failed to add the user to your followings list`, 400);
    }
    // #endregion
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    this._logger.info(
      `Attempting to remove ${followingId} from ${followerId}'s followings list`
    );

    // #region Remove the following from the follower's followings list
    try {
      const followerQuery = <unknown>{
        _id: followerId,
        $pull: { followings: followingId },
      };

      await this._userRepository.updateUser(<User>followerQuery);
    } catch (error: unknown) {
      this._logger.error(
        `Error removing ${followingId} from ${followerId}'s followings list`
      );

      throwError(`Failed to remove the user from your followings list`, 400);
    }
    // #endregion

    // #region Remove the follower from the following's followers list
    try {
      const followingQuery = <unknown>{
        _id: followingId,
        $pull: { followers: followerId },
      };

      await this._userRepository.updateUser(<User>followingQuery);
    } catch (error: unknown) {
      this._logger.error(
        `Error removing ${followerId} from ${followingId}'s followers list`
      );

      this._logger.info(
        `Adding ${followingId} back to ${followerId}'s followings list`
      );

      const followerQuery = <unknown>{
        _id: followerId,
        $addToSet: { followings: followingId },
      };

      await this._userRepository.updateUser(<User>followerQuery);

      throwError(`Failed to remove the user from your followings list`, 400);
    }
    // #endregion
  }
}
