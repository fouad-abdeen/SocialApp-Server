import Container, { Service } from "typedi";
import { BaseService, Context, SocketConnectionProvider } from "../core";
import { NotificationRepository } from "../repositories";
import { Notification } from "../models";
import {
  NotificationAction,
  NotificationActionMetadata,
} from "../shared/notification.types";

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
    if (Context.getUser()._id === userId) return;

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
        followerUsername,
        followingId: userId,
      },
    });

    await this.sendWebNotification(userId, notification);
  }

  async notifyAboutActionOnContent(
    userId: string,
    contentType: "post" | "comment",
    action: NotificationAction,
    actionMetadata: NotificationActionMetadata
  ): Promise<void> {
    if (Context.getUser()._id === userId) return;

    const actionVerb = action.split("_")[1];

    this.setRequestId();
    this._logger.info(
      `Notifying the user with id ${userId} about a ${actionVerb} on their ${contentType}`
    );

    let notification =
      await this._notificationRepository.getNotificationByActionMetadata(
        action,
        {
          postId: actionMetadata.postId,
          commentId: actionMetadata.commentId,
        }
      );

    if (notification)
      await this.updateNotification(
        notification,
        contentType,
        actionMetadata,
        actionVerb
      );
    else
      notification = await this._notificationRepository.createNotification(<
        Notification
      >{
        user: userId,
        content: `You have a new ${actionVerb} on your ${contentType}: ${actionMetadata.contentBrief}`,
        action,
        actionMetadata,
      });

    await this.sendWebNotification(userId, notification);
  }

  async removeNotificationAction(
    userId: string,
    action: NotificationAction,
    actionMetadata: NotificationActionMetadata
  ): Promise<void> {
    if (Context.getUser()._id === userId) return;

    this.setRequestId();
    this._logger.info(
      `Removing the notification action for the user with id ${userId}`
    );

    const notification =
      await this._notificationRepository.getNotificationByActionMetadata(
        action,
        {
          postId: actionMetadata.postId,
          commentId: actionMetadata.commentId,
        }
      );

    if (!notification) return;

    const numberOfActions =
      notification.actionMetadata.actionDatabaseDocuments.length;

    if (numberOfActions === 1) {
      await this._notificationRepository.deleteNotification(notification._id);
    } else {
      const actionVerb = action.split("_")[1];
      const pluralActionVerb =
        actionVerb === "reply" ? "replies" : `${actionVerb}s`;

      notification.content = notification.content.replace(
        `You have ${numberOfActions} new ${pluralActionVerb}`,
        numberOfActions === 2
          ? `You have a new ${actionVerb}`
          : `You have ${numberOfActions - 1} new ${pluralActionVerb}`
      );

      notification.actionMetadata.actionDatabaseDocuments =
        notification.actionMetadata.actionDatabaseDocuments.filter(
          (id) => id !== actionMetadata.actionDatabaseDocuments[0]
        );

      await this._notificationRepository.updateNotification(notification);
    }
  }

  private async updateNotification(
    notification: Notification,
    contentType: "post" | "comment",
    newMetadata: NotificationActionMetadata,
    actionVerb: string
  ): Promise<void> {
    const pluralActionVerb =
      actionVerb === "reply" ? "replies" : `${actionVerb}s`;

    if (notification.isRead) {
      // If the notification is already read, reset the notification and update the content
      notification.isRead = false;
      notification.actionMetadata.actionDatabaseDocuments =
        newMetadata.actionDatabaseDocuments;
      notification.content = `You have a new ${actionVerb} on your ${contentType}: ${newMetadata.contentBrief}`;
    } else {
      // If the notification is not read, update the content
      notification.actionMetadata.actionDatabaseDocuments.push(
        ...newMetadata.actionDatabaseDocuments
      );
      notification.content = `You have ${notification.actionMetadata.actionDatabaseDocuments.length} new ${pluralActionVerb} on your ${contentType}: ${newMetadata.contentBrief}`;
    }

    await this._notificationRepository.updateNotification(notification);
  }

  private async sendWebNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    if (!(await this.isUserOnline(userId))) return;

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
