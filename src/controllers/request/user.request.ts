import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class FollowingQueryParams {
  @IsMongoId({ message: "Invalid or missing following id" })
  followingId: string;
}

export class ProfileEditRequest {
  @IsMongoId({ message: "Invalid or missing user id" })
  id: string;

  @IsOptional()
  @MinLength(2, { message: "First name cannot be shorter than 2 characters" })
  @MaxLength(50, { message: "First name cannot be longer than 50 characters" })
  @IsString({ message: "Invalid first name" })
  firstName?: string;

  @IsOptional()
  @MinLength(2, { message: "Last name cannot be shorter than 2 characters" })
  @MaxLength(50, { message: "Last name cannot be longer than 50 characters" })
  @IsString({ message: "Invalid last name" })
  lastName?: string;

  @IsOptional()
  @MaxLength(200, { message: "Bio cannot be longer than 200 characters" })
  @IsString({ message: "Invalid bio" })
  bio?: string;
}
