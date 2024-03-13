import { IsString } from "class-validator";

export class User {
  @IsString()
  id: string;
  @IsString()
  username: string;
  @IsString()
  firstName: string;
  @IsString()
  lastName: string;
  @IsString()
  avatar: string;
}

export interface PopulatedUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
}
