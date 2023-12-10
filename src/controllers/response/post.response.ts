import { IsDate, IsString } from "class-validator";
import { Post } from "../../models";

export class PostResponse {
  @IsString()
  id: string;

  @IsString()
  user: string;

  @IsString()
  content: string;

  @IsString({ each: true })
  likes: string[];

  @IsString({ each: true })
  comments: string[];

  @IsString()
  image: string;

  @IsDate()
  createdAt?: Date;

  @IsDate()
  updatedAt?: Date;

  public static getPostResponse(post: Post): PostResponse {
    return {
      id: post._id?.toString(),
      user: post.user,
      content: post.content,
      likes: post.likes,
      comments: post.comments,
      image: post.image,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  public static getPostsListResponse(posts: Post[]): PostResponse[] {
    return posts.map((post) => PostResponse.getPostResponse(post));
  }
}
