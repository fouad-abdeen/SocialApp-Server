import { Model } from "mongoose";
import { BaseService, MongodbConnectionProvider, throwError } from "../core";
import { IFileRepository } from "./interfaces";
import { File } from "../models";
import Container, { Service } from "typedi";

@Service()
export class FileRepository extends BaseService implements IFileRepository {
  private readonly _model: Model<File>;

  constructor(private _mongoService: MongodbConnectionProvider) {
    super(__filename);

    if (!this._mongoService)
      this._mongoService = Container.get(MongodbConnectionProvider);

    this._model = this._mongoService.getModel(File, {
      timestamps: true,
    }) as unknown as Model<File>;
  }

  async createFile(key: string, url: string): Promise<File> {
    this.setRequestId();
    this._logger.info(`Creating the file with key: ${key}`);

    const createdFile = (await this._model.create({ key, url })).toObject();

    return createdFile;
  }

  async updateFile(id: string, url: string): Promise<File> {
    this.setRequestId();
    this._logger.info(`Updating file with id: ${id}`);

    const updatedFile = await this._model
      .findByIdAndUpdate(
        id,
        { url },
        {
          new: true,
        }
      )
      .lean()
      .exec();

    if (!updatedFile) throwError(`File with Id ${id} not found`, 404);

    return <File>updatedFile;
  }

  async deleteFile(id: string): Promise<void> {
    this.setRequestId();
    this._logger.info(`Deleting file with id: ${id}`);

    await this._model.findByIdAndDelete(id);
  }

  async getFileById(id: string): Promise<File> {
    this.setRequestId();
    this._logger.info(`Getting file with id: ${id}`);

    const file = await this._model.findById(id).lean().exec();

    if (!file) throwError(`File with Id ${id} not found`, 404);

    return <File>file;
  }
}
