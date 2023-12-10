import Container, { Service } from "typedi";
import {
  BaseService,
  Context,
  MongodbConnectionProvider,
  throwError,
} from "../core";
import { Post } from "../models";
import { IPostRepository } from "./interfaces";
import { Model } from "mongoose";
import { Pagination } from "../types";

@Service()
export class PostRepository extends BaseService implements IPostRepository {
  private readonly _model: Model<Post>;

  constructor(private _mongoService: MongodbConnectionProvider) {
    super(__filename);

    if (!this._mongoService)
      this._mongoService = Container.get(MongodbConnectionProvider);

    this._model = this._mongoService.getModel(Post, { timestamps: true });

    (async () => {
      await this._model.createIndexes();
    })();
  }

  async createPost(post: Post): Promise<Post> {
    this.setRequestId();
    this._logger.info(`Creating the post for user: ${post.user}`);

    const createdPost = (await this._model.create(post)).toObject();

    return createdPost;
  }

  async updatePost(post: Post): Promise<Post> {
    const { _id, ...data } = post;

    this.setRequestId();
    this._logger.info(`Updating post with id: ${_id}`);

    const updatedPost = await this._model
      .findByIdAndUpdate(_id, data, {
        new: true,
      })
      .lean()
      .exec();

    if (!updatedPost) throwError(`Post with Id ${_id} not found`, 404);

    return <Post>updatedPost;
  }

  async deletePost(postId: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Deleting post with id: ${postId}`);

    await this._model.findByIdAndDelete(postId);
  }

  async getTimelinePosts(pagination: Pagination): Promise<Post[]> {
    const user = Context.getUser();

    this.setRequestId();
    this._logger.info(`Getting timeline posts for user: ${user._id}`);

    const posts = await this._model
      .find({
        user: { $in: user.followings },
        ...(pagination.lastDocumentId
          ? { _id: { $lt: pagination.lastDocumentId } }
          : {}),
      })
      .sort({ _id: -1 })
      .limit(pagination.limit)
      .lean()
      .exec();

    return <Post[]>posts;
  }

  async getUserPosts(pagination: Pagination, userId: string): Promise<Post[]> {
    this.setRequestId();
    this._logger.info(`Getting posts for user: ${userId}`);

    const posts = await this._model
      .find({
        user: userId,
        ...(pagination.lastDocumentId
          ? { _id: { $lt: pagination.lastDocumentId } }
          : {}),
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(pagination.limit)
      .lean()
      .exec();

    return <Post[]>posts;
  }

  async getPostById(postId: string): Promise<Post> {
    this.setRequestId();
    this._logger.info(`Getting post with id: ${postId}`);

    const post = await this._model.findById(postId).lean().exec();

    if (!post) throwError(`Post with Id ${postId} not found`, 404);

    return <Post>post;
  }
}
