import { IsString, IsDate, IsObject } from "class-validator";
import { Notification } from "../../models";
import {
  NotificationAction,
  NotificationActionMetadata,
} from "../../shared/notification.types";

export class NotificationResponse {
  @IsString()
  id: string;

  @IsString()
  user: string;

  @IsString()
  content: string;

  @IsString()
  action: NotificationAction;

  @IsObject()
  actionMetadata: NotificationActionMetadata;

  @IsDate()
  createdAt?: Date;

  @IsDate()
  updatedAt?: Date;

  public static getNotificationResponse(
    notification: Notification
  ): NotificationResponse {
    return {
      id: notification._id?.toString(),
      user: notification.user,
      content: notification.content,
      action: notification.action,
      actionMetadata: notification.actionMetadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  public static getNotificationsListResponse(
    notifications: Notification[]
  ): NotificationResponse[] {
    return notifications.map((notification) =>
      NotificationResponse.getNotificationResponse(notification)
    );
  }
}
