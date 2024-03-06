import { nanoid } from "nanoid";
import {
  BaseService,
  Context,
  FileInfo,
  FileUpload,
  FileUploadProvider,
  env,
  throwError,
} from "../core";
import { File, Post, User } from "../models";
import Container, { Service } from "typedi";
import {
  CommentRepository,
  FileRepository,
  PostRepository,
  UserRepository,
} from "../repositories";

@Service()
export class PostService extends BaseService {
  constructor(
    private _postRepository: PostRepository,
    private _commentRepository: CommentRepository,
    private _userRepository: UserRepository,
    private _fileRepository: FileRepository,
    private _fileService: FileUploadProvider
  ) {
    super(__filename);
    if (!_fileService) this._fileService = Container.get(FileUploadProvider);
  }

  async submitPost(post: Post, image?: FileUpload): Promise<Post> {
    this.setRequestId();
    this._logger.info(`Attempting to create a new post for user: ${post.user}`);

    if (image) {
      this._logger.info("Attempting to upload image for the post");

      const { originalname, buffer, size } = image;

      if (size > 1000000) throwError("Image size must be less than 1MB", 400);

      let fileInfo = <FileInfo>{};

      try {
        // Upload image file to S3
        fileInfo = await this._fileService.uploadFile(
          `image-${nanoid()}`,
          `${originalname.split(".").pop()}`,
          buffer,
          env.awsS3.bucket,
          `posts-media/media-${post.user}/`,
          ["png", "jpg", "jpeg"]
        );
      } catch (error: any) {
        this._logger.error(error.message);
        throwError(`Failed to upload post's image. ${error.message}`, 400);
      }

      // Get presigned URL for the uploaded file
      const presignedUrl = await this._fileService.getSignedURL(
        fileInfo.key,
        env.awsS3.bucket
      );

      // Create a new file in the database
      const file = await this._fileRepository.createFile(
        fileInfo.key,
        presignedUrl
      );

      // Set the post's image
      post.image = file._id;
    }

    const createdPost = await this._postRepository.createPost(post);

    const userQuery = <unknown>{
      _id: post.user,
      $addToSet: { posts: createdPost._id },
    };

    await this._userRepository.updateUser(<User>userQuery);

    return createdPost;
  }

  async updatePost(postId: string, content: string): Promise<Post> {
    this.setRequestId();
    this._logger.info(`Attempting to update the post: ${postId}`);

    const user = Context.getUser();
    const post = await this._postRepository.getPostById(postId);

    if (user._id !== post.user)
      throwError(`You can't update someone else's post`, 403);

    // Check if the post can be updated or not
    if (post.createdAt) {
      const currentDate = new Date(new Date().toUTCString());

      // Get difference in milliseconds between current date and post creation date
      const millisecondsDifference =
        currentDate.getTime() - post.createdAt.getTime();

      // Allow updating a post within 1 hour of submission
      if (millisecondsDifference > 3600000)
        throwError("You can't update a post after 1 hour of submission", 400);
    }

    return await this._postRepository.updatePost(<Post>{
      _id: postId,
      content,
    });
  }

  async deletePost(postId: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Attempting to delete the post: ${postId}`);

    const user = Context.getUser();
    const post = (await this._postRepository.getPostById(
      postId,
      true
    )) as Post & { image: File | null };

    if (user._id !== post.user)
      throwError(`You can't delete someone else's post`, 403);

    if (post.image) {
      // Populated image
      const image = <File>post.image;

      try {
        this._logger.info("Deleting the post's image");

        // Delete file from S3
        await this._fileService.deleteFile(image.key, env.awsS3.bucket);

        // Delete file from the database
        await this._fileRepository.deleteFile(image._id);
      } catch (error: any) {
        this._logger.error(error.message);
        throwError(`Failed to delete your avatar. ${error.message}`, 400);
      }
    }

    // Delete all comments of the post including the replies
    await this._commentRepository.deletePostComments(postId);

    await this._postRepository.deletePost(postId);

    const userQuery = <unknown>{
      _id: post.user,
      $pull: { posts: postId },
    };

    await this._userRepository.updateUser(<User>userQuery);
  }
}
