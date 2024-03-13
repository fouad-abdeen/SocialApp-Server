import Container, { Service } from "typedi";
import {
  BaseService,
  env,
  FileInfo,
  FileUpload,
  FileUploadProvider,
  throwError,
} from "../core";
import { FileRepository, UserRepository } from "../repositories";
import { User } from "../models";

@Service()
export class UserService extends BaseService {
  constructor(
    private _userRepository: UserRepository,
    private _fileRepository: FileRepository,
    private _fileService: FileUploadProvider
  ) {
    super(__filename);
    if (!this._fileService)
      this._fileService = Container.get(FileUploadProvider);
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    this.setRequestId();
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
    this.setRequestId();
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

  async uploadAvatar(user: User, avatar: FileUpload): Promise<string> {
    this.setRequestId();
    this._logger.info(`Attempting to upload ${user._id}'s avatar`);

    const { originalname, buffer, size } = avatar;

    if (size > 500000) throwError(`File size must be less than 500KB`, 400);

    let fileInfo = <FileInfo>{};

    try {
      // Upload file to S3, if the user already has an avatar, it will be replaced
      fileInfo = await this._fileService.uploadFile(
        `avatar-${user._id}`,
        `${originalname.split(".").pop()}`,
        buffer,
        env.awsS3.bucket,
        "avatars/",
        ["png", "jpg", "jpeg"]
      );
    } catch (error: any) {
      this._logger.error(error.message);
      throwError(`Failed to upload your avatar. ${error.message}`, 400);
    }

    if (user.avatarUpdatedAt) {
      const minutesSinceLastUpdate =
        (Date.now() - user.avatarUpdatedAt) / 60000;
      if (minutesSinceLastUpdate < 2)
        throwError(`You can only update your avatar every 2 minutes`, 400);
    }

    // Generate a signed URL for the file
    const presignedUrl = await this._fileService.getSignedURL(
      fileInfo.key,
      env.awsS3.bucket
    );

    if (user.avatar)
      await this._fileRepository.updateFile(user.avatar, presignedUrl);
    else {
      // Create a new file in the database
      const file = await this._fileRepository.createFile(
        fileInfo.key,
        presignedUrl
      );

      // Update the user's avatar
      const query = <unknown>{
        _id: user._id,
        avatar: file._id,
        avatarUpdatedAt: Date.now(),
      };

      await this._userRepository.updateUser(<User>query);

      user.avatar = file._id.toString();
    }

    return user.avatar;
  }

  async deleteAvatar(user: User): Promise<void> {
    const { _id } = user;

    this.setRequestId();
    this._logger.info(`Attempting to delete ${_id}'s avatar`);

    if (!user.avatar) return;

    try {
      const file = await this._fileRepository.getFileById(user.avatar);

      // Delete file from S3
      await this._fileService.deleteFile(file.key, env.awsS3.bucket);

      // Delete file from the database
      await this._fileRepository.deleteFile(file._id);
    } catch (error: any) {
      this._logger.error(error.message);
      throwError(`Failed to delete your avatar. ${error.message}`, 400);
    }

    const query = <unknown>{
      _id,
      avatar: null,
    };

    await this._userRepository.updateUser(<User>query);
  }
}
