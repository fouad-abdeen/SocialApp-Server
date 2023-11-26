import { AnyParamConstructor } from "@typegoose/typegoose/lib/types";
import { Logger } from "../../..";
import { Model } from "mongoose";

export interface IMongoConnectionProvider {
  /**
   * Establishes a connection to the database.
   * To use at the launch of the app.
   */
  connect(): Promise<void>;

  /**
   * Creates a mongoose model from a class.
   * @param documentClass Unintialized MongoDB Document Class (used to create mongoose model from class).
   * @returns Mongoose Model.
   **/
  getModel<T, U extends AnyParamConstructor<T>>(documentClass: U): Model<any>;

  /**
   * Closes the current connection created when initializing the service.
   */
  closeConnection(): Promise<void>;

  /**
   * Creates a new collection inside the database.
   * @param name Collection name that will be created.
   * @param deletePrevious If set to true, then deletes any existing collection that has the same name. Otherwise, this function safely succeeds.
   */
  createCollection(name: string, deletePrevious?: boolean): Promise<void>;
}
