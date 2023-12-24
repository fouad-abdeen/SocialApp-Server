import { Service } from "typedi";
import { BaseService, Context, throwError } from "../core";
import { CommentRepository, PostRepository } from "../repositories";
import { Comment, Post } from "../models";
import { isMongoId } from "class-validator";

@Service()
export class CommentService extends BaseService {
  constructor(
    private _commentRepository: CommentRepository,
    private _postRepository: PostRepository
  ) {
    super(__filename);
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    this.setRequestId();
    this._logger.info(`Attempting to update the comment: ${commentId}`);

    const user = Context.getUser();
    const comment = await this._commentRepository.getCommentById(commentId);

    if (user._id !== comment.user)
      throwError(`You can't update someone else's comment`, 403);

    // Check if the comment can be updated or not
    if (comment.createdAt) {
      const currentDate = new Date(new Date().toUTCString());

      // Get difference in milliseconds between current date and comment creation date
      const millisecondsDifference =
        currentDate.getTime() - comment.createdAt.getTime();

      // Allow updating a comment within 30 minutes of submission
      if (millisecondsDifference > 1800000)
        throwError(
          "You can't update a comment after 30 minutes of submission",
          400
        );
    }

    return await this._commentRepository.updateComment(<Comment>{
      _id: commentId,
      content,
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Attempting to delete the comment: ${commentId}`);

    const userId = Context.getUser()._id;
    const comment = await this._commentRepository.getCommentById(commentId);

    if (comment.user !== userId)
      throwError(`You can't delete someone else's comment`, 403);

    // If the comment is a reply to another comment
    if (isMongoId(comment.replyTo)) {
      const query = <unknown>{
        _id: comment.replyTo,
        $pull: { replies: commentId },
      };

      // Remove the reply from the comment's replies list
      await this._commentRepository.updateComment(<Comment>query);
    }
    // If the comment is a reply to a post
    else {
      const query = <unknown>{
        _id: comment.post,
        $pull: { comments: commentId },
      };

      // Remove the comment from the post's comments list
      await this._postRepository.updatePost(<Post>query);

      // Delete all the comment's replies
      await this._commentRepository.deleteCommentReplies(commentId);
    }

    await this._commentRepository.deleteComment(commentId);
  }

  async replyToComment(commentId: string, content: string): Promise<Comment> {
    this.setRequestId();
    this._logger.info(`Attempting to reply to the comment: ${commentId}`);

    const user = Context.getUser();
    const comment = await this._commentRepository.getCommentById(commentId);

    if (isMongoId(comment.replyTo))
      throwError(`You can't reply to a reply`, 403);

    // Create the reply in the database
    const reply = await this._commentRepository.createComment(<Comment>{
      user: user._id,
      post: comment.post,
      content,
      replyTo: commentId,
    });

    const commentQuery = <unknown>{
      _id: commentId,
      $addToSet: { replies: reply._id },
    };

    // Add the reply to the comment's replies list
    await this._commentRepository.updateComment(<Comment>commentQuery);

    return reply;
  }
}
