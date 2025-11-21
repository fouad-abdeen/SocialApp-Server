import Container, { Service } from "typedi";
import {
  BaseService,
  Context,
  MongodbConnectionProvider,
  throwError,
} from "../core";
import { IUserRepository } from "./interfaces";
import { User } from "../models";
import { Model } from "mongoose";
import { Pagination } from "../shared/pagination.model";

@Service()
export class UserRepository extends BaseService implements IUserRepository {
  private readonly _model: Model<User>;

  constructor(private _mongoService: MongodbConnectionProvider) {
    super(__filename);

    if (!this._mongoService)
      this._mongoService = Container.get(MongodbConnectionProvider);

    this._model = this._mongoService.getModel(User, {
      timestamps: true,
    }) as unknown as Model<User>;

    (async () => {
      await this._model.createIndexes();
    })();
  }

  async createUser(user: User): Promise<User> {
    this.setRequestId();
    this._logger.info(`Creating user with username: ${user.username}`);

    const createdUser = (await this._model.create(user)).toObject();

    return createdUser;
  }

  async updateUser(user: User): Promise<User> {
    const { _id, ...data } = user;

    this.setRequestId();
    this._logger.info(`Updating user with id: ${_id}`);

    const updatedUser = await this._model.findByIdAndUpdate(_id, data);

    if (!updatedUser) throwError(`User with Id ${_id} not found`, 404);

    return <User>updatedUser;
  }

  async getUserById(id: string, projection?: string): Promise<User> {
    this.setRequestId();
    this._logger.info(`Getting user by id: ${id}`);

    const user = (await this._model
      .findById(id, projection)
      .lean()
      .exec()) as User;

    if (!user) throwError(`User with id ${id} not found`, 404);

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    this.setRequestId();
    this._logger.info(`Getting user by email: ${email}`);

    const user = (await this._model.findOne({ email }).lean().exec()) as User;

    if (!user) throwError(`User with email ${email} not found`, 404);

    return user;
  }

  async getUserByUsername(username: string): Promise<User> {
    this.setRequestId();
    this._logger.info(`Getting user by username: ${username}`);

    const user = (await this._model
      .findOne({ username })
      .lean()
      .exec()) as User;

    if (!user) throwError(`User with username ${username} not found`, 404);

    return user;
  }

  async searchUsersByUsername(
    usernameQuery: string,
    pagination: Pagination
  ): Promise<User[]> {
    this.setRequestId();
    this._logger.info(
      `Searching for users with username matching: ${usernameQuery}`
    );

    const query = {
      username: {
        // Search for users with username matching the query
        $regex: usernameQuery,
        // Make the search case insensitive
        $options: "i",
      },
      _id: {
        // Exclude current user from search results
        $ne: Context.getUser()._id,
      },
      // Add an additional condition for pagination based on lastDocumentId
      ...(pagination.lastDocumentId
        ? // If lastDocumentId is provided, return users with id greater than lastDocumentId
          { _id: { $gt: pagination.lastDocumentId } }
        : {}),
    };

    const users = await this._model
      .find(query, "username firstName lastName avatar")
      .sort({ _id: 1 })
      .limit(pagination.limit)
      .lean()
      .exec();

    return users;
  }

  async getlistOfUsersByIds(
    userIds: string[],
    pagination: Pagination
  ): Promise<User[]> {
    this.setRequestId();
    this._logger.info(`Getting list of users by ids: ${userIds}`);

    const users = await this._model
      .find({ _id: { $in: userIds } })
      .sort({ _id: 1 })
      .find(
        pagination.lastDocumentId
          ? { _id: { $gt: pagination.lastDocumentId } }
          : {}
      )
      .limit(pagination.limit)
      .lean()
      .exec();

    return users;
  }
}
