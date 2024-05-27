import {
  Authorized,
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
  QueryParams,
  UploadedFile,
} from "routing-controllers";
import { BaseService, Context, throwError } from "../core";
import { Service } from "typedi";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { Comment, Post as SocialPost } from "../models";
import { CommentOnPostRequest, SubmitPostRequest } from "./request";
import { NotificationService, PostService } from "../services";
import {
  CommentResponse,
  PostResponse,
  PostWithUserResponse,
} from "./response";
import {
  CommentRepository,
  NotificationRepository,
  PostRepository,
} from "../repositories";
import { Pagination } from "../shared/pagination.model";
import { isMongoId } from "class-validator";
import { truncateValue } from "../core/utils/truncate";
import { NotificationAction } from "../shared/notification.types";

@JsonController("/posts")
@Service()
export class PostController extends BaseService {
  constructor(
    private _postService: PostService,
    private _notificationService: NotificationService,
    private _postRepository: PostRepository,
    private _commentRepository: CommentRepository,
    private _notificationRepository: NotificationRepository
  ) {
    super(__filename);
  }

  // #region Submit a post
  @Authorized()
  @Post("/")
  @OpenAPI({
    summary: "Submit a post",
    description: `
    Submit a post with an optional image.
    Minimum length of content is 15 characters and maximum is 3000 characters.
    To submit an image, use Postman and send a multipart/form-data request with a file field with the key 'image'.
    The image must be of type png, jpg or jpeg and must not exceed 1MB in size.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(PostResponse)
  async submitPost(
    @Body() { content }: SubmitPostRequest,
    @UploadedFile("image") image
  ): Promise<PostResponse> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(
      `Received a request to submit a post for user: ${userId}`
    );

    const submittedPost = await this._postService.submitPost(
      <SocialPost>{
        user: userId,
        content,
      },
      image
    );

    return PostResponse.getPostResponse(submittedPost);
  }
  // #endregion

  // #region Update a post
  @Authorized()
  @Patch("/:postId")
  @OpenAPI({
    summary: "Update a post",
    description: `
    Update the content of a post.
    Minimum length of content is 15 characters and maximum is 3000 characters.
    Updating the content is allowed within 1 hour of submitting the post.
    `,
    security: [{ bearerAuth: [] }],
  })
  async updatePost(
    @Param("postId") postId: string,
    @Body() { content }: SubmitPostRequest
  ): Promise<PostResponse> {
    this.setRequestId();
    this._logger.info(`Received a request to update the post: ${postId}`);

    if (!isMongoId(postId)) throwError(`Invalid post id: ${postId}`, 400);

    const updatedPost = await this._postService.updatePost(postId, content);

    return PostResponse.getPostResponse(updatedPost);
  }
  // #endregion

  // #region Delete a post
  @Authorized()
  @Delete("/:postId")
  @OpenAPI({
    summary: "Delete a post",
    security: [{ bearerAuth: [] }],
  })
  async deletePost(@Param("postId") postId: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Received a request to delete the post: ${postId}`);

    if (!isMongoId(postId)) throwError(`Invalid post id: ${postId}`, 400);

    await this._postService.deletePost(postId);
  }
  // #endregion

  // #region Like a post
  @Authorized()
  @Post("/:postId/like")
  @OpenAPI({
    summary: "Like a post",
    security: [{ bearerAuth: [] }],
  })
  async likePost(@Param("postId") postId: string): Promise<void> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(`Received a request to like the post: ${postId}`);

    if (!isMongoId(postId)) throwError(`Invalid post id: ${postId}`, 400);

    const query = <unknown>{
      _id: postId,
      $addToSet: { likes: userId },
    };

    const post = await this._postRepository.updatePost(<SocialPost>query);

    const notification =
      await this._notificationRepository.getNotificationByActionMetadata(
        NotificationAction.POST_LIKE,
        { postId }
      );

    // Check if the post's owner has already been notified about the like
    if (
      notification &&
      notification.actionMetadata.actionDatabaseDocuments.includes(userId)
    )
      return;

    // Notify the post's owner about the like
    await this._notificationService.notifyAboutActionOnContent(
      post.user.toString(),
      "post",
      NotificationAction.POST_LIKE,
      {
        actionDatabaseDocuments: [userId],
        postId: post._id.toString(),
        contentBrief: truncateValue(post.content),
      }
    );
  }
  // #endregion

  // #region Unlike a post
  @Authorized()
  @Delete("/:postId/like")
  @OpenAPI({
    summary: "Unlike a post",
    security: [{ bearerAuth: [] }],
  })
  async unlikePost(@Param("postId") postId: string): Promise<void> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(`Received a request to unlike the post: ${postId}`);

    if (!isMongoId(postId)) throwError(`Invalid post id: ${postId}`, 400);

    const query = <unknown>{
      _id: postId,
      $pull: { likes: userId },
    };

    const post = await this._postRepository.updatePost(<SocialPost>query);

    // Remove the notification about the like
    await this._notificationService.removeNotificationAction(
      post.user.toString(),
      NotificationAction.POST_LIKE,
      {
        actionDatabaseDocuments: [userId],
        postId,
      }
    );
  }
  // #endregion

  // #region Comment on a post
  @Authorized()
  @Post("/:postId/comment")
  @OpenAPI({
    summary: "Comment on a post",
    description: `
    Submit a comment on a post.
    Minimum length of content is 5 characters and maximum is 1000 characters.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(CommentResponse)
  async commentOnPost(
    @Param("postId") postId: string,
    @Body() { content }: CommentOnPostRequest
  ): Promise<CommentResponse> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(`Attempting to comment on the post: ${postId}`);

    if (!isMongoId(postId)) throwError(`Invalid post id: ${postId}`, 400);

    const createdComment = await this._commentRepository.createComment(<
      Comment
    >{
      user: userId,
      post: postId,
      content,
    });

    // Update the post with the new comment
    const query = <unknown>{
      _id: createdComment.post,
      $addToSet: { comments: createdComment._id },
    };

    const post = await this._postRepository.updatePost(<SocialPost>query);

    const notification =
      await this._notificationRepository.getNotificationByActionMetadata(
        NotificationAction.POST_COMMENT,
        { postId }
      );

    // Check if the post's owner has already been notified about the comment
    if (
      notification &&
      notification.actionMetadata.actionDatabaseDocuments.includes(
        createdComment._id
      )
    )
      return CommentResponse.getCommentResponse(createdComment);

    // Notify the post's owner about the comment
    await this._notificationService.notifyAboutActionOnContent(
      post.user.toString(),
      "post",
      NotificationAction.POST_COMMENT,
      {
        actionDatabaseDocuments: [createdComment._id],
        postId: post._id.toString(),
        contentBrief: truncateValue(post.content),
      }
    );

    return CommentResponse.getCommentResponse(createdComment);
  }
  // #endregion

  // #region Get timeline posts
  @Authorized()
  @Get("/")
  @OpenAPI({
    summary: "Get timeline posts",
    description: `
    Get a list of posts of the users that the current user is following.
    The posts are paginated and sorted in descending order of creation date.
    limit: limit of documents to return, default is 5.
    lastDocumentId: id of the last document in the previous page. If not provided, it will return the first page.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(PostWithUserResponse, { isArray: true })
  async getTimelinePosts(
    @QueryParams() pagination: Pagination
  ): Promise<PostWithUserResponse[]> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(
      `Received a request to get timeline posts for: ${userId}`
    );

    const posts = await this._postRepository.getTimelinePosts(pagination);

    return PostWithUserResponse.getPostsListResponse(posts);
  }
  // #endregion

  // #region Get user posts
  @Authorized()
  @Get("/user/:userId")
  @OpenAPI({
    summary: "Get user posts",
    description: `
    Get a list of posts of a user.
    The posts are paginated and sorted in descending order of creation date.
    limit: limit of documents to return, default is 5.
    lastDocumentId: id of the last document in the previous page. If not provided, it will return the first page.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(PostResponse, { isArray: true })
  async getUserPosts(
    @QueryParams() pagination: Pagination,
    @Param("userId") userId: string
  ): Promise<PostResponse[]> {
    this.setRequestId();
    this._logger.info(`Received a request to get posts for: ${userId}`);

    if (!isMongoId(userId)) throwError(`Invalid user id: ${userId}`, 400);

    const posts = await this._postRepository.getUserPosts(pagination, userId);

    return PostResponse.getPostsListResponse(posts);
  }
  // #endregion

  // #region Get a post by ID
  @Authorized()
  @Get("/:postId")
  @OpenAPI({
    summary: "Get a post by ID",
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(PostWithUserResponse)
  async getPostById(
    @Param("postId") postId: string
  ): Promise<PostWithUserResponse> {
    this.setRequestId();
    this._logger.info(`Received a request to get the post: ${postId}`);

    if (!isMongoId(postId)) throwError(`Invalid post id: ${postId}`, 400);

    const post = await this._postRepository.getPostById(postId);

    return PostWithUserResponse.getPostResponse(post);
  }
  // #endregion
}
