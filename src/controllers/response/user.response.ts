import { IsBoolean, IsString } from "class-validator";
import { User } from "../../models";

export class UserResponse {
  @IsString()
  id: string;

  @IsString()
  username: string;

  @IsString()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString({ each: true })
  followers: string[];

  @IsString({ each: true })
  followings: string[];

  @IsString({ each: true })
  posts: string[];

  @IsString()
  bio: string;

  @IsString()
  avatar: string;

  @IsBoolean()
  verified: boolean;

  public static getUserResponse(user: User): UserResponse {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      followers: user.followers,
      followings: user.followings,
      posts: user.posts,
      bio: user.bio,
      avatar: user.avatar,
      verified: user.verified,
    };
  }
}

export class UserSearchResponse {
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

  public static getUserSearchResponse(users: User[]): UserSearchResponse[] {
    return users.map((user) => {
      return {
        id: user._id.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      };
    });
  }
}

export class UserProfileResponse {
  @IsString()
  id: string;

  @IsString()
  username: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString({ each: true })
  followers: string[];

  @IsString({ each: true })
  followings: string[];

  @IsString({ each: true })
  posts: string[];

  @IsString()
  bio: string;

  @IsString()
  avatar: string;

  public static getUserProfileResponse(user: User): UserProfileResponse {
    return {
      id: user._id.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      followers: user.followers,
      followings: user.followings,
      posts: user.posts,
      bio: user.bio,
      avatar: user.avatar,
    };
  }
}

export class UploadAvatarResponse {
  @IsString()
  fileKey: string;
}
