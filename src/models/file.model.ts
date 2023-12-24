import { prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

export class File extends TimeStamps {
  public _id!: string;

  @prop({ type: String, required: true })
  public key!: string;

  @prop({ type: String, required: true })
  public url!: string;
}
