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

  // #region Get File
  @Authorized()
  @Get("/")
  @OpenAPI({
    summary: "Get a file by key",
  })
  async getFile(
    @QueryParam("key", { required: true }) fileKey: string,
    @Res() response: Response
  ): Promise<void> {
    let url = "";

    this.setRequestId();
    this._logger.info(`Attempting to get file with key: ${fileKey}`);

    try {
      // Make sure that the file exists before getting the signed URL
      await this._fileService.getObject(fileKey, env.awsS3.bucket);

      url = await this._fileService.getSignedURL(fileKey, env.awsS3.bucket, 60);
    } catch (error: any) {
      this._logger.error(error.message);
      throwError(`Failed to get file. ${error.message}`, 400);
    }

    response.redirect(url);
  }
  // #endregion
}
