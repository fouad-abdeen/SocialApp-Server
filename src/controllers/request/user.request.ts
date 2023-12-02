import { IsMongoId } from "class-validator";

export class FollowingQueryParams {
  @IsMongoId({ message: "Invalid or missing following id" })
  followingId: string;
}
