import Container, { Service } from "typedi";
import { BaseService, SocketConnectionProvider } from "../core";
import { NotificationRepository } from "../repositories";
import { Notification } from "../models";
import { NotificationAction } from "../shared/notification.types";

@Service()
export class NotificationService extends BaseService {
  constructor(
    private _socketConnection: SocketConnectionProvider,
    private _notificationRepository: NotificationRepository
  ) {
    super(__filename);
    this._socketConnection = Container.get(SocketConnectionProvider);
  }

  async notifyAboutFollowRequest(
    userId: string,
    followerUsername: string
  ): Promise<void> {
    this.setRequestId();
    this._logger.info(
      `Notifying the user with id ${userId} about a follow request`
    );

    const notification = await this._notificationRepository.createNotification(<
      Notification
    >{
      user: userId,
      content: `${followerUsername} has started following you`,
      action: NotificationAction.FOLLOW_REQUEST,
      actionMetadata: {
        username: followerUsername,
      },
    });

    await this.sendWebNotification(userId, notification);
  }

  async notifyAboutPostLike(
    userId: string,
    postId: string,
    postContent: string
  ): Promise<void> {
    this.setRequestId();
    this._logger.info(`Notifying the user with id ${userId} about a post like`);

    let notification =
      await this._notificationRepository.getNotificationByActionMetadata(
        NotificationAction.POST_LIKE,
        {
          postId,
        }
      );

    if (notification) {
      // If the notification is already read, reset the notification and update the content
      if (notification.isRead) {
        notification.isRead = false;
        notification.actionMetadata.numberOfLikes = 1;
        notification.content = `You have a new like on your post: ${postContent}`;
      }
      // If the notification is not read, update the content
      else {
        (<number>notification.actionMetadata.numberOfLikes) += 1;
        notification.content = `You have ${notification.actionMetadata.numberOfLikes} likes on your post: ${postContent}`;
      }

      await this._notificationRepository.updateNotification(notification);
    } else {
      notification = await this._notificationRepository.createNotification(<
        Notification
      >{
        user: userId,
        content: `You have a new like on your post: ${postContent}`,
        action: NotificationAction.POST_LIKE,
        actionMetadata: {
          postId,
          numberOfLikes: 1,
          postBriefContent: postContent,
        },
      });
    }

    await this.sendWebNotification(userId, notification);
  }

  // Other methods to implement:
  // 1. notifyAboutPostComment
  // 2. notifyAboutCommentLike
  // 3. notifyAboutCommentReply

  private async sendWebNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    if (!this.isUserOnline(userId)) return;

    this._logger.info(
      `Sending a web notification to the user with id ${userId}`
    );

    this._socketConnection.socketIoServer
      .to(userId)
      .emit("notification", notification);
  }

  private async isUserOnline(userId: string): Promise<boolean> {
    this._logger.info(`Checking if user with id ${userId} is online`);

    return (
      (await this._socketConnection.socketIoServer.to(userId).fetchSockets())
        .length > 0
    );
  }
}
