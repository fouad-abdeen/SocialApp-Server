import { prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { AuthTokenObject } from "../types";
import { FileInfo } from "../core/providers/file-upload";

export class User extends TimeStamps {
  public _id!: string;

  @prop({
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  })
  public username!: string;

  @prop({ type: String, required: true })
  public password!: string;

  @prop({ type: String, required: true, lowercase: true, unique: true })
  public email!: string;

  @prop({ type: String, required: true })
  public firstName!: string;

  @prop({ type: String, required: true })
  public lastName!: string;

  @prop({ type: String, default: [], ref: "User" })
  public followers!: string[];

  @prop({ type: String, default: [], ref: "User" })
  public followings!: string[];

  @prop({ type: String, default: [], ref: "Tweet" })
  public tweets!: string[];

  @prop({ type: String, default: "" })
  public bio!: string;

  @prop({ type: Object, default: {} })
  public avatar!: FileInfo;

  @prop({ type: Boolean, default: false })
  public verified!: boolean;

  @prop({ type: AuthTokenObject, default: [] })
  public tokensDenylist!: AuthTokenObject[];

  @prop({ type: Number, default: +new Date() })
  public passwordUpdatedAt!: number;
}
