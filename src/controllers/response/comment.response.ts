import { IsDate, IsInstance, IsString } from "class-validator";
import { User } from "../../shared/user.types";
import { CommentWithUser } from "../../shared/comment.types";

export class CommentResponse {
  @IsString()
  id: string;

  @IsString()
  user: string;

  @IsString()
  post: string;

  @IsString()
  content: string;

  @IsString({ each: true })
  likes: string[];

  @IsString({ each: true })
  replies: string[];

  @IsString()
  replyTo: string;

  @IsDate()
  createdAt?: Date;

  @IsDate()
  updatedAt?: Date;

  public static getCommentResponse(comment) {
    return {
      id: comment._id?.toString(),
      user: comment.user,
      post: comment.post,
      content: comment.content,
      likes: comment.likes,
      replies: comment.replies,
      replyTo: comment.replyTo,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  public static getCommentsListResponse(comments) {
    return comments.map((comment) =>
      CommentResponse.getCommentResponse(comment)
    );
  }
}

export class CommentWithUserResponse {
  @IsString()
  id: string;

  @IsInstance(User)
  user: User;

  @IsString()
  post: string;

  @IsString()
  content: string;

  @IsString({ each: true })
  likes: string[];

  @IsString({ each: true })
  replies: string[];

  @IsString()
  replyTo: string;

  @IsDate()
  createdAt?: Date;

  @IsDate()
  updatedAt?: Date;

  public static getCommentResponse(comment: CommentWithUser) {
    const { _id, ...user } = comment.user;

    return {
      id: comment._id?.toString(),
      user: {
        id: _id.toString(),
        ...user,
      },
      post: comment.post,
      content: comment.content,
      likes: comment.likes,
      replies: comment.replies,
      replyTo: comment.replyTo,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  public static getCommentsListResponse(comments: CommentWithUser[]) {
    return comments.map((comment) =>
      CommentWithUserResponse.getCommentResponse(comment)
    );
  }
}
