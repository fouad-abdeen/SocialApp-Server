import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class ProfileEditRequest {
  @IsOptional()
  @IsNotEmpty({ message: "First name cannot be empty" })
  @MaxLength(50, { message: "First name cannot be longer than 50 characters" })
  @IsString({ message: "Invalid first name" })
  firstName?: string;

  @IsOptional()
  @IsNotEmpty({ message: "Last name cannot be empty" })
  @MaxLength(50, { message: "Last name cannot be longer than 50 characters" })
  @IsString({ message: "Invalid last name" })
  lastName?: string;

  @IsOptional()
  @MaxLength(200, { message: "Bio cannot be longer than 200 characters" })
  @IsString({ message: "Invalid bio" })
  bio?: string;
}
