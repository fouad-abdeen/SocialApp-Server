import { IsDate, IsInstance, IsObject, IsString } from "class-validator";
import { Post } from "../../models";
import { PostWithUser } from "../../shared/post.types";
import { User } from "../../shared/user.types";

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

export class PostWithUserResponse {
  @IsString()
  id: string;

  @IsInstance(User)
  user: User;

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

  public static getPostResponse(
    post: PostWithUser
  ): PostWithUserResponse {
    const { _id, ...user } = post.user;

    return {
      id: post._id?.toString(),
      user: {
        id: _id?.toString(),
        ...user,
      },
      content: post.content,
      likes: post.likes,
      comments: post.comments,
      image: post.image,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  public static getPostsListResponse(
    posts: PostWithUser[]
  ): PostWithUserResponse[] {
    return posts.map((post) =>
      PostWithUserResponse.getPostResponse(post)
    );
  }
}
