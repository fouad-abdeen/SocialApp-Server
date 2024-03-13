import { PopulatedUser } from "./user.types";

export interface CommentWithUser {
  _id: string;
  user: PopulatedUser;
  post: string;
  content: string;
  likes: string[];
  replies: string[];
  replyTo: string;
  createdAt?: Date;
  updatedAt?: Date;
}
