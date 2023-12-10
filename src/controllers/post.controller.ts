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
import { PostService } from "../services";
import { CommentResponse, PostResponse } from "./response";
import { CommentRepository, PostRepository } from "../repositories";
import { Pagination } from "../types";
import { isMongoId } from "class-validator";

@JsonController("/posts")
@Service()
export class PostController extends BaseService {
  constructor(
    private _postService: PostService,
    private _postRepository: PostRepository,
    private _commentRepository: CommentRepository
  ) {
    super(__filename);
  }

  // #region Submit a post
  @Authorized()
  @Post("/")
  @OpenAPI({
    summary: "Submit a post",
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

    await this._postRepository.updatePost(<SocialPost>query);
  }
  // #endregion

  // #region Comment on a post
  @Authorized()
  @Post("/:postId/comment")
  @OpenAPI({
    summary: "Comment on a post",
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

    await this._postRepository.updatePost(<SocialPost>query);

    return CommentResponse.getCommentResponse(createdComment);
  }
  // #endregion

  // #region Get timeline posts
  @Authorized()
  @Get("/")
  @OpenAPI({
    summary: "Get timeline posts",
  })
  @ResponseSchema(PostResponse, { isArray: true })
  async getTimelinePosts(
    @QueryParams() pagination: Pagination
  ): Promise<PostResponse[]> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(
      `Received a request to get timeline posts for: ${userId}`
    );

    const posts = await this._postRepository.getTimelinePosts(pagination);

    return PostResponse.getPostsListResponse(posts);
  }
  // #endregion

  // #region Get user posts
  @Authorized()
  @Get("/:userId")
  @OpenAPI({
    summary: "Get user posts",
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
}
