import { IMongodbConnectionProvider } from "./mongodb.interface";
import { connect, Connection, connection, SchemaOptions } from "mongoose";
import {
  AnyParamConstructor,
  ReturnModelType,
} from "@typegoose/typegoose/lib/types";
import { Logger } from "../../../logger";
import { getModelForClass } from "@typegoose/typegoose";
import { BaseService } from "../../../base.service";

export class MongodbConnectionProvider
  extends BaseService
  implements IMongodbConnectionProvider
{
  private _connection: Connection;
  private _dbHost: string;
  private _dbName: string;

  /**
   * Creates an instance of MongoDB Connection Provider.
   * Check out Connection String URI Format (DB_HOST):
   * https://docs.mongodb.com/manual/reference/connection-string/
   * @param dbHost Connection string URI, including MongoDB cluster/server host
   * @param dbName Database name, will be appended to dbHost
   * @param logger Optional: logger to use for logging
   */
  constructor(dbHost: string, dbName: string, logger: Logger) {
    super(__filename, logger);
    this._dbHost = dbHost;
    this._dbName = dbName;
  }

  async connect(): Promise<void> {
    try {
      const mongoose = await connect(this._dbHost + this._dbName);
      this._connection = mongoose.connection;
      this._logger.info("Connected to MongoDB");
    } catch (error: any) {
      this._logger.error(
        "An error has occurred while connecting to MongoDB",
        error
      );
      throw new Error(error.message || "Error connecting to MongoDB");
    }
  }

  getModel<T, U extends AnyParamConstructor<T>>(
    documentClass: U,
    schemaOptions?: SchemaOptions
  ): ReturnModelType<U> {
    this.dbConnectionCheck();
    return getModelForClass(documentClass, {
      existingConnection: this._connection,
      schemaOptions,
    });
  }

  async closeConnection(): Promise<void> {
    await connection.close();
    this._connection = {} as Connection;
    this._logger.info("Disconnected from MongoDB");
  }

  async createCollection(
    name: string,
    deletePrevious?: boolean
  ): Promise<void> {
    this.dbConnectionCheck();

    if (deletePrevious) {
      this._logger.info(
        `Dropping collection ${name} from ${this._connection.db.databaseName}`
      );
      await this._connection.dropCollection(name);
    }

    this._logger.info(
      `Creating collection ${name} in ${this._connection.db.databaseName}`
    );
    await this._connection.createCollection(name);
  }

  private dbConnectionCheck() {
    if (this._connection) if (this._connection.db) return;
    this._logger.error("MongoDB connection does not exist");
    throw new Error("Error connecting to MongoDB");
  }
}
