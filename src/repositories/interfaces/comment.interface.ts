import { Comment } from "../../models";
import { CommentWithUser } from "../../shared/comment.types";
import { Pagination } from "../../shared/pagination.model";

export interface ICommentRepository {
  /**
   * Creates a new comment
   * @param comment comment to create
   * @returns created comment
   */
  createComment(comment: Comment): Promise<Comment>;

  /**
   * Updates a comment
   * @param comment comment to update
   * @returns updated comment
   */
  updateComment(comment: Comment): Promise<Comment>;

  /**
   * Deletes a comment
   * @param commentId id of the comment to delete
   * @param userId id of the user deleting the comment
   */
  deleteComment(commentId: string, userId: string): Promise<void>;

  /**
   * Deletes all comments of a post
   * @param postId id of the post to delete comments of
   */
  deletePostComments(postId: string): Promise<void>;

  /**
   * Deletes all replies of a comment
   * @param commentId id of the comment to delete replies of
   */
  deleteCommentReplies(commentId: string): Promise<void>;

  /**
   * Gets comments of a post
   * @param pagination pagination options
   * @param postId id of the post to get comments of
   * @returns found comments with user details
   */
  getPostComments(pagination: Pagination, postId: string): Promise<CommentWithUser[]>;

  /**
   * Gets replies of a comment
   * @param pagination pagination options
   * @param commentId id of the comment to get replies of
   * @returns found replies with user details
   */
  getCommentReplies(
    pagination: Pagination,
    commentId: string
  ): Promise<CommentWithUser[]>;

  /**
   * Gets a comment by id
   * @param commentId id of the comment to get
   * @returns the comment
   */
  getCommentById(commentId: string): Promise<Comment>;
}
