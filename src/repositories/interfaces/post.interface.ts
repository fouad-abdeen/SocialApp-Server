import { Post } from "../../models";
import { Pagination } from "../../shared/pagination.model";
import { PostWithUser } from "../../shared/post.types";

export interface IPostRepository {
  /**
   * Creates a new post
   * @param post post to create
   * @returns created post
   */
  createPost(post: Post): Promise<Post>;

  /**
   * Updates an existing post
   * @param post post to update
   * @returns updated post
   */
  updatePost(post: Post): Promise<Post>;

  /**
   * Deletes a post by id
   * @param postId id of the post to delete
   */
  deletePost(postId: string): Promise<void>;

  /**
   * Gets timeline posts
   * @param pagination pagination options
   * @returns found posts
   */
  getTimelinePosts(pagination: Pagination): Promise<PostWithUser[]>;

  /**
   * Gets posts of a user
   * @param pagination pagination options
   * @param userId id of the user to get posts of
   * @returns found posts
   */
  getUserPosts(pagination: Pagination, userId: string): Promise<Post[]>;

  /**
   *  Gets a post by id
   * @param postId id of the post to get
   * @param populateImage whether to populate the image field
   * @returns the post with user details
   */
  getPostById(postId: string, populateImage?: boolean): Promise<PostWithUser>;
}
