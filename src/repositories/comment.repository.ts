import Container, { Service } from "typedi";
import { BaseService, MongodbConnectionProvider, throwError } from "../core";
import { ICommentRepository } from "./interfaces";
import { Comment } from "../models";
import { Model } from "mongoose";
import { Pagination } from "../shared/pagination.model";
import { CommentWithUser } from "../shared/comment.types";
import { PopulatedUser } from "../shared/user.types";

@Service()
export class CommentRepository
  extends BaseService
  implements ICommentRepository
{
  private readonly _model: Model<Comment>;

  constructor(private _mongoService: MongodbConnectionProvider) {
    super(__filename);

    if (!this._mongoService)
      this._mongoService = Container.get(MongodbConnectionProvider);

    this._model = this._mongoService.getModel(Comment, { timestamps: true });
  }

  async createComment(comment: Comment): Promise<Comment> {
    this.setRequestId();
    this._logger.info(`Creating the comment for user: ${comment.user}`);

    const createdComment = (await this._model.create(comment)).toObject();

    return createdComment;
  }

  async updateComment(comment: Comment): Promise<Comment> {
    const { _id, ...data } = comment;

    this.setRequestId();
    this._logger.info(`Updating comment with id: ${_id}`);

    const updatedComment = await this._model
      .findByIdAndUpdate(_id, data, {
        new: true,
      })
      .lean()
      .exec();

    if (!updatedComment) throwError(`Comment with Id ${_id} not found`, 404);

    return <Comment>updatedComment;
  }

  async deleteComment(commentId: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Deleting comment with id: ${commentId}`);

    await this._model.findByIdAndDelete(commentId);
  }

  async deletePostComments(postId: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Deleting all comments for post with id: ${postId}`);

    await this._model.deleteMany({ post: postId });
  }

  async deleteCommentReplies(commentId: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Deleting replies for comment with id: ${commentId}`);

    await this._model.deleteMany({ replyTo: commentId });
  }

  async getPostComments(
    pagination: Pagination,
    postId: string
  ): Promise<CommentWithUser[]> {
    this.setRequestId();
    this._logger.info(`Getting comments for post with id: ${postId}`);

    // Get main comments of a post paginated and sorted by the creation date in ascending order
    const comments = await this._model
      .find({
        post: postId,
        replyTo: "",
        ...(pagination.lastDocumentId
          ? { _id: { $gt: pagination.lastDocumentId } }
          : {}),
      })
      .populate({ path: "user", select: "username firstName lastName avatar" })
      .sort({ _id: 1 })
      .limit(pagination.limit)
      .lean()
      .exec();

    return comments as Array<Comment & {user: PopulatedUser}>;
  }

  async getCommentReplies(
    pagination: Pagination,
    commentId: string
  ): Promise<CommentWithUser[]> {
    this.setRequestId();
    this._logger.info(`Getting replies for comment with id: ${commentId}`);

    // Get replies of a comment paginated and sorted by the creation date in ascending order
    const comments = await this._model
      .find({
        replyTo: commentId,
        ...(pagination.lastDocumentId
          ? { _id: { $gt: pagination.lastDocumentId } }
          : {}),
      })
      .populate({ path: "user", select: "username firstName lastName avatar" })
      .sort({ _id: 1 })
      .limit(pagination.limit)
      .lean()
      .exec();

    return comments as Array<Comment & {user: PopulatedUser}>;
  }

  async getCommentById(commentId: string): Promise<Comment> {
    this.setRequestId();
    this._logger.info(`Getting comment with id: ${commentId}`);

    const comment = await this._model.findById(commentId).lean().exec();

    if (!comment) throwError(`Comment with Id ${commentId} not found`, 404);

    return <Comment>comment;
  }
}
