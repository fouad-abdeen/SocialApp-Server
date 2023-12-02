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
import { Pagination } from "../types";

@Service()
export class UserRepository extends BaseService implements IUserRepository {
  private readonly _model: Model<User>;

  constructor(private _mongoService: MongodbConnectionProvider) {
    super(__filename);

    if (!this._mongoService)
      this._mongoService = Container.get(MongodbConnectionProvider);

    this._model = this._mongoService.getModel(User, { timestamps: true });

    (async () => {
      await this._model.createIndexes();
    })();
  }

  async createUser(user: User): Promise<User> {
    this._logger.info(`Creating user with username: ${user.username}`);

    const createdUser = (
      await this._model.create({
        ...user,
        passwordUpdatedAt: +new Date(),
      })
    ).toObject();

    return createdUser;
  }

  async updateUser(user: User): Promise<User> {
    const { _id, ...data } = user;

    this._logger.info(`Updating user with id: ${_id}`);

    const updatedUser = await this._model.findByIdAndUpdate(_id, data);

    if (!updatedUser) throwError(`User with Id ${_id} not found`, 404);

    return <User>updatedUser;
  }

  async getUserByUsername(username: string): Promise<User> {
    this._logger.info(`Getting user by username: ${username}`);

    const user = (await this._model
      .findOne({ username })
      .lean()
      .exec()) as User;

    if (!user) throwError(`User with username ${username} not found`, 404);

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    this._logger.info(`Getting user by email: ${email}`);

    const user = (await this._model.findOne({ email }).lean().exec()) as User;

    if (!user) throwError(`User with email ${email} not found`, 404);

    return user;
  }

  async searchUsersByUsername(
    usernameQuery: string,
    pagination: Pagination
  ): Promise<User[]> {
    this._logger.info(
      `Searching for users with username matching: ${usernameQuery}`
    );

    const currentUserId = Context.getUser()._id;

    const users = await this._model
      .find(
        {
          username: {
            $regex: usernameQuery,
            // Insensitive case search
            $options: "i",
          },
          _id: {
            // Exclude current user from search results
            $ne: currentUserId,
          },
        },
        "username firstName lastName avatar"
      )
      .sort({ _id: 1 })
      .find({
        _id: pagination.lastDocumentId
          ? // If lastDocumentId is provided, then get the next page of results
            { $gt: pagination.lastDocumentId }
          : // Otherwise, get the first page of results
            {},
      })
      .limit(pagination.limit)
      .lean()
      .exec();

    return users;
  }
}
