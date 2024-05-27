export enum NotificationAction {
  FOLLOW_REQUEST = "follow_request",
  POST_LIKE = "post_like",
  POST_COMMENT = "post_comment",
  COMMENT_LIKE = "comment_like",
  COMMENT_REPLY = "comment_reply",
}

/**
 * Metadata for a notification action
 * @param followerUsername Username of the follower
 * @param followingId Id of the user being followed
 * @param postId Id of the post that was liked or commented on
 * @param commentId Id of the comment that was liked or replied to
 * @param actionDatabaseDocuments Database documents related to the action
 * @param contentBrief Brief content of the post or comment
 */
export interface NotificationActionMetadata {
  actionDatabaseDocuments: string[];
  followerUsername?: string;
  followingId?: string;
  postId?: string;
  commentId?: string;
  contentBrief?: string;
}
