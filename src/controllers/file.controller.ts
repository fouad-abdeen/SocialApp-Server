import {
  Authorized,
  Get,
  JsonController,
  QueryParam,
  Res,
} from "routing-controllers";
import { Service } from "typedi";
import { BaseService, env, FileUploadProvider, throwError } from "../core";
import { OpenAPI } from "routing-controllers-openapi";
import { Response } from "express";

@JsonController("/files")
@Service()
export class FileController extends BaseService {
  constructor(private _fileService: FileUploadProvider) {
    super(__filename);
  }

  // #region Get file by key
  @Authorized()
  @Get("/")
  @OpenAPI({
    summary: "Get a File by Key",
  })
  async getFile(
    @QueryParam("key", { required: true }) fileKey: string,
    @Res() response: Response
  ): Promise<void> {
    let url = "";

    this._logger.info(`Attempting to get file with key: ${fileKey}`);

    try {
      url = await this._fileService.getSignedURL(fileKey, env.awsS3.bucket, 60);
    } catch (error: any) {
      this._logger.error(error.message);
      throwError(`Failed to get file`, 400);
    }

    response.redirect(url);
  }
  // #endregion
}
