import { IsString, MaxLength, MinLength } from "class-validator";

export class SubmitPostRequest {
  @MinLength(15, { message: "Post must be at least 15 characters long" })
  @MaxLength(3000, { message: "Post cannot be longer than 3000 characters" })
  @IsString({ message: "Invalid or missing post content" })
  content: string;
}

export class CommentOnPostRequest {
  @MinLength(5, { message: "Comment must be at least 5 characters long" })
  @MaxLength(1000, { message: "Comment cannot be longer than 1000 characters" })
  @IsString({ message: "Invalid or missing comment content" })
  content: string;
}
