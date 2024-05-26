import { prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import {
  NotificationAction,
  NotificationActionMetadata,
} from "../shared/notification.types";

export class Notification extends TimeStamps {
  public _id!: string;

  @prop({ type: String, required: true, ref: "User" })
  public user!: string;

  @prop({ type: String, required: true })
  public content!: string;

  @prop({ type: Boolean, default: false })
  public isRead!: boolean;

  @prop({ type: String, default: null })
  public action!: NotificationAction;

  @prop({ type: Object, default: {} })
  public actionMetadata!: NotificationActionMetadata;
}
