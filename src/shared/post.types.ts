import { PopulatedUser } from "./user.types";

export interface PostWithUser {
  _id: string;
  user: PopulatedUser;
  content: string;
  likes: string[];
  comments: string[];
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}
