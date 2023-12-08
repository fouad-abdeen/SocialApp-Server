import {
  AnyParamConstructor,
  ReturnModelType,
} from "@typegoose/typegoose/lib/types";
import { SchemaOptions } from "mongoose";

export interface IMongodbConnectionProvider {
  /**
   * Establishes a connection to the database.
   * To use at the launch of the app.
   */
  connect(): Promise<void>;

  /**
   * Creates a mongoose model from a class.
   * @param documentClass Unintialized MongoDB Document class used to create the model.
   * @param schemaOptions Custom schema options to use when creating the model.
   * @returns Mongoose Model.
   **/
  getModel<T, U extends AnyParamConstructor<T>>(
    documentClass: U,
    schemaOptions?: SchemaOptions
  ): ReturnModelType<U>;

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
