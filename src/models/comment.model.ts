import { prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

export class Comment extends TimeStamps {
  public _id!: string;

  @prop({ type: String, required: true, ref: "User" })
  public user: string;

  @prop({ type: String, required: true, ref: "Post" })
  public post: string;

  @prop({ type: String, required: true })
  public content: string;

  @prop({ type: String, default: [], ref: "User" })
  public likes: string[];

  @prop({ type: String, default: [], ref: "Comment" })
  public replies: string[];

  @prop({ type: String, default: "", ref: "Comment" })
  public replyTo!: string;
}
