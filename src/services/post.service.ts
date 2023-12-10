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
import { Post } from "../models";
import Container, { Service } from "typedi";
import { CommentRepository, PostRepository } from "../repositories";

@Service()
export class PostService extends BaseService {
  constructor(
    private _postRepository: PostRepository,
    private _commentRepository: CommentRepository,
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

      post.image = fileInfo.key;
    }

    return await this._postRepository.createPost(post);
  }

  async updatePost(postId: string, content: string): Promise<Post> {
    this.setRequestId();
    this._logger.info(`Attempting to update the post: ${postId}`);

    const user = Context.getUser();
    const post = await this._postRepository.getPostById(postId);

    if (user._id !== post.user)
      throwError(`You can't update someone else's post`, 403);

    // get difference between post creation date and current date
    if (post.createdAt) {
      const currentDate = new Date(new Date().toUTCString());

      // get difference in milliseconds between current date and post creation date
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
    const post = await this._postRepository.getPostById(postId);

    if (user._id !== post.user)
      throwError(`You can't delete someone else's post`, 403);

    if (post.image.includes(`posts-media/media-${post.user}`)) {
      this._logger.info("Deleting the post's image");

      try {
        await this._fileService.deleteFile(post.image, env.awsS3.bucket);
      } catch (error: any) {
        this._logger.error(error.message);
        throwError(`Failed to delete your avatar. ${error.message}`, 400);
      }
    }

    await this._commentRepository.deletePostComments(postId);

    await this._postRepository.deletePost(postId);
  }
}
