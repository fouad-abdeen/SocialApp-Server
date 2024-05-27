import {
  Authorized,
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
  QueryParam,
  QueryParams,
} from "routing-controllers";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { Service } from "typedi";
import { BaseService, Context, throwError } from "../core";
import { CommentResponse, CommentWithUserResponse } from "./response";
import { CommentService, NotificationService } from "../services";
import { CommentOnPostRequest } from "./request";
import { CommentRepository, NotificationRepository } from "../repositories";
import { Comment } from "../models";
import { Pagination } from "../shared/pagination.model";
import { isMongoId } from "class-validator";
import { NotificationAction } from "../shared/notification.types";
import { truncateValue } from "../core/utils/truncate";

@JsonController("/comments")
@Service()
export class CommentController extends BaseService {
  constructor(
    private _commentService: CommentService,
    private _notificationService: NotificationService,
    private _commentRepository: CommentRepository,
    private _notificationRepository: NotificationRepository
  ) {
    super(__filename);
  }

  // #region Update a comment
  @Authorized()
  @Patch("/:commentId")
  @OpenAPI({
    summary: "Update a comment",
    description: `
    Update the content of a comment.
    Minimum length of content is 5 characters and maximum is 1000 characters.
    Updating the content is allowed within 30 minutes of submission.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(CommentResponse)
  async updateComment(
    @Param("commentId") commentId: string,
    @Body() { content }: CommentOnPostRequest
  ): Promise<CommentResponse> {
    this.setRequestId();
    this._logger.info(`Received a request to update the comment: ${commentId}`);

    if (!isMongoId(commentId))
      throwError(`Invalid comment id: ${commentId}`, 400);

    const updatedComment = await this._commentService.updateComment(
      commentId,
      content
    );

    return CommentResponse.getCommentResponse(updatedComment);
  }
  // #endregion

  // #region Delete a comment
  @Authorized()
  @Delete("/:commentId")
  @OpenAPI({
    summary: "Delete a comment",
    security: [{ bearerAuth: [] }],
  })
  async deleteComment(@Param("commentId") commentId: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Received a request to delete the comment: ${commentId}`);

    if (!isMongoId(commentId))
      throwError(`Invalid comment id: ${commentId}`, 400);

    await this._commentService.deleteComment(commentId);
  }
  // #endregion

  // #region Like a comment
  @Authorized()
  @Post("/:commentId/like")
  @OpenAPI({
    summary: "Like a comment",
    security: [{ bearerAuth: [] }],
  })
  async likeComment(@Param("commentId") commentId: string): Promise<void> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(`Received a request to like the comment: ${commentId}`);

    if (!isMongoId(commentId))
      throwError(`Invalid comment id: ${commentId}`, 400);

    const query = <unknown>{
      _id: commentId,
      $addToSet: { likes: userId },
    };

    const comment = await this._commentRepository.updateComment(<Comment>query);

    const notification =
      await this._notificationRepository.getNotificationByActionMetadata(
        NotificationAction.COMMENT_LIKE,
        { commentId }
      );

    // Check if the comments's owner has already been notified about the like
    if (
      notification &&
      notification.actionMetadata.actionDatabaseDocuments.includes(userId)
    )
      return;

    // Notify the comment's owner about the like
    await this._notificationService.notifyAboutActionOnContent(
      comment.user.toString(),
      "comment",
      NotificationAction.COMMENT_LIKE,
      {
        actionDatabaseDocuments: [userId],
        postId: comment.post.toString(),
        commentId: comment._id.toString(),
        contentBrief: truncateValue(comment.content),
      }
    );
  }
  // #endregion

  // #region Unlike a comment
  @Authorized()
  @Delete("/:commentId/like")
  @OpenAPI({
    summary: "Unlike a comment",
    security: [{ bearerAuth: [] }],
  })
  async unlikeComment(@Param("commentId") commentId: string): Promise<void> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(`Received a request to unlike the comment: ${commentId}`);

    if (!isMongoId(commentId))
      throwError(`Invalid comment id: ${commentId}`, 400);

    const query = <unknown>{
      _id: commentId,
      $pull: { likes: userId },
    };

    await this._commentRepository.updateComment(<Comment>query);

    // Remove the notification about the like
    await this._notificationService.removeNotificationAction(
      userId,
      NotificationAction.COMMENT_LIKE,
      {
        actionDatabaseDocuments: [userId],
        commentId,
      }
    );
  }

  // #region Reply to a comment
  @Authorized()
  @Post("/:commentId/reply")
  @OpenAPI({
    summary: "Reply to a comment",
    description: `
    Submit a reply to a comment.
    Minimum length of content is 5 characters and maximum is 1000 characters.
    User can't reply to a comment that is a reply to another comment.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(CommentResponse)
  async replyToComment(
    @Param("commentId") commentId: string,
    @Body() { content }: CommentOnPostRequest
  ): Promise<CommentResponse> {
    this.setRequestId();
    this._logger.info(`Received a reply request to the comment: ${commentId}`);

    if (!isMongoId(commentId))
      throwError(`Invalid comment id: ${commentId}`, 400);

    const reply = await this._commentService.replyToComment(commentId, content);

    return CommentResponse.getCommentResponse(reply);
  }
  // #endregion

  // #region Get comments of a post
  @Authorized()
  @Get("/")
  @OpenAPI({
    summary: "Get comments of a post",
    description: `
    Get comments of a post paginated and sorted by the creation date in ascending order.
    limit: limit of documents to return, default is 5.
    lastDocumentId: id of the last document in the previous page. If not provided, it will return the first page.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(CommentWithUserResponse, { isArray: true })
  async getPostComments(
    @QueryParams() pagination: Pagination,
    @QueryParam("postId", { required: true }) postId: string
  ): Promise<CommentWithUserResponse[]> {
    this.setRequestId();
    this._logger.info(
      `Received a request to get comments of the post: ${postId}`
    );

    if (!isMongoId(postId)) throwError(`Invalid post id: ${postId}`, 400);

    const comments = await this._commentRepository.getPostComments(
      pagination,
      postId
    );

    return CommentWithUserResponse.getCommentsListResponse(comments);
  }

  // #endregion

  // #region Get replies of a comment
  @Authorized()
  @Get("/:commentId/replies")
  @OpenAPI({
    summary: "Get replies of a comment",
    description: `
    Get replies of a comment paginated and sorted by the creation date in ascending order.
    limit: limit of documents to return, default is 5.
    lastDocumentId: id of the last document in the previous page. If not provided, it will return the first page.
    `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(CommentWithUserResponse, { isArray: true })
  async getCommentReplies(
    @QueryParams() pagination: Pagination,
    @Param("commentId") commentId: string
  ): Promise<CommentWithUserResponse[]> {
    this.setRequestId();
    this._logger.info(
      `Received a request to get replies of the comment: ${commentId}`
    );

    if (!isMongoId(commentId))
      throwError(`Invalid comment id: ${commentId}`, 400);

    const replies = await this._commentRepository.getCommentReplies(
      pagination,
      commentId
    );

    return CommentWithUserResponse.getCommentsListResponse(replies);
  }
  // #endregion
}
