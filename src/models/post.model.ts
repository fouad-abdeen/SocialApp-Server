import { prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

export class Post extends TimeStamps {
  public _id!: string;

  @prop({ type: String, required: true, ref: "User" })
  user: string;

  @prop({ type: String, required: true })
  public content!: string;

  @prop({ type: String, default: [], ref: "User" })
  public likes!: string[];

  @prop({ type: String, default: [], ref: "Comment" })
  public comments!: string[];

  @prop({ type: String, default: "" })
  public image!: string;
}
