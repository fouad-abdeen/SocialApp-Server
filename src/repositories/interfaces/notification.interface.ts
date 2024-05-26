import { Notification } from "../../models";
import { NotificationActionMetadata } from "../../shared/notification.types";
import { Pagination } from "../../shared/pagination.model";

export interface INotificationRepository {
  /**
   * Creates a new notification
   * @param notification notification to create
   */
  createNotification(notification: Notification): Promise<Notification>;

  /**
   * Updates a notification
   * @param notification notification to update
   */
  updateNotification(notification: Notification): Promise<Notification>;

  /**
   * Gets a notification by action metadata
   * @param action action of the notification
   * @param actionMetadata metadata of the action
   */
  getNotificationByActionMetadata(
    action: string,
    actionMetadata: NotificationActionMetadata
  ): Promise<Notification>;

  /**
   * Gets notifications of a user
   * @param pagination pagination options
   * @param userId id of the user
   */
  getNotifications(
    pagination: Pagination,
    userId: string
  ): Promise<Notification[]>;
}
