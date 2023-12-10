import { IsDate, IsString } from "class-validator";

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
