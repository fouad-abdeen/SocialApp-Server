import { Model } from "mongoose";
import {
  BaseService,
  Context,
  MongodbConnectionProvider,
  throwError,
} from "../core";
import { INotificationRepository } from "./interfaces";
import { Notification } from "../models";
import Container, { Service } from "typedi";
import { Pagination } from "../shared/pagination.model";
import { NotificationActionMetadata } from "../shared/notification.types";

@Service()
export class NotificationRepository
  extends BaseService
  implements INotificationRepository
{
  private readonly _model: Model<Notification>;

  constructor(private _mongoService: MongodbConnectionProvider) {
    super(__filename);

    if (!this._mongoService)
      this._mongoService = Container.get(MongodbConnectionProvider);

    this._model = this._mongoService.getModel(Notification, {
      timestamps: true,
    });
  }

  async createNotification(notification: Notification): Promise<Notification> {
    this.setRequestId();
    this._logger.info(
      `Creating the notification for user: ${notification.user}`
    );

    const createdNotification = (
      await this._model.create(notification)
    ).toObject();

    return createdNotification;
  }

  async updateNotification(notification: Notification): Promise<Notification> {
    const { _id, ...data } = notification;

    this.setRequestId();
    this._logger.info(`Updating notification with id: ${_id}`);

    const updatedNotification = await this._model
      .findByIdAndUpdate(_id, data, {
        new: true,
      })
      .lean()
      .exec();

    if (!updatedNotification)
      throwError(`Notification with Id ${_id} not found`, 404);

    return <Notification>updatedNotification;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Deleting notification with id: ${notificationId}`);

    await this._model.findByIdAndDelete(notificationId);
  }

  async deleteNotificationsByActionMetadata(
    actionMetadata: Partial<NotificationActionMetadata>
  ): Promise<void> {
    this.setRequestId();
    this._logger.info(
      `Deleting notifications with actionMetadata: ${JSON.stringify(
        actionMetadata
      )}`
    );

    const query = {};

    // If the notification action is a follow request
    if (actionMetadata.followerUsername)
      query["actionMetadata.followerUsername"] =
        actionMetadata.followerUsername;
    if (actionMetadata.followingId)
      query["actionMetadata.followingId"] = actionMetadata.followingId;

    // If the notification action is a post or comment
    if (actionMetadata.postId)
      query["actionMetadata.postId"] = actionMetadata.postId;
    if (actionMetadata.commentId)
      query["actionMetadata.commentId"] = actionMetadata.commentId;

    await this._model.deleteMany(query);
  }

  async getNotificationByActionMetadata(
    action: string,
    actionMetadata: Partial<NotificationActionMetadata>
  ): Promise<Notification> {
    this.setRequestId();
    this._logger.info(
      `Getting notification with action: ${action} and actionMetadata: ${JSON.stringify(
        actionMetadata
      )}`
    );

    const query = { action };

    if (actionMetadata.postId)
      query["actionMetadata.postId"] = actionMetadata.postId;
    if (actionMetadata.commentId)
      query["actionMetadata.commentId"] = actionMetadata.commentId;

    return <Notification>await this._model.findOne(query).lean().exec();
  }

  async getNotifications(
    pagination: Pagination,
    userId: string
  ): Promise<Notification[]> {
    this.setRequestId();
    this._logger.info(`Getting notifications for user: ${userId}`);

    return await this._model
      .find({
        user: userId,
        ...(pagination.lastDocumentId
          ? { _id: { $lt: pagination.lastDocumentId } }
          : {}),
      })
      .sort({ _id: -1 })
      .limit(pagination.limit)
      .lean()
      .exec();
  }
}
