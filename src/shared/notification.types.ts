export enum NotificationAction {
  FOLLOW_REQUEST = "follow_request",
  POST_LIKE = "post_like",
  POST_COMMENT = "post_comment",
  COMMENT_LIKE = "comment_like",
  COMMENT_REPLY = "comment_reply",
}

/**
 * Metadata for a notification action
 * @param username The username of a new follower
 * @param postId Id of the post that was liked or commented on
 * @param commentId Id of the comment that was liked or replied to
 * @param numberOfLikes Number of likes on a post or comment
 * @param numberOfComments Number of comments on a post
 * @param numberOfReplies Number of replies on a comment
 * @param postBriefContent Brief content of the post
 * @param commentBriefContent Brief content of the comment
 */
export interface NotificationActionMetadata {
  username?: string;
  postId?: string;
  commentId?: string;
  numberOfLikes?: number;
  numberOfComments?: number;
  numberOfReplies?: number;
  postBriefContent?: string;
  commentBriefContent?: string;
}
