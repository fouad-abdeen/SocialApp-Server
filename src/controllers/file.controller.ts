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
import { isMongoId } from "class-validator";
import { FileRepository } from "../repositories";

@JsonController("/files")
@Service()
export class FileController extends BaseService {
  constructor(
    private _fileRepository: FileRepository,
    private _fileService: FileUploadProvider
  ) {
    super(__filename);
  }

  // #region Get File
  @Authorized()
  @Get("/")
  @OpenAPI({
    summary: "Get a file by id",
    description: `
    This endpoint serves as a proxy to get a file from AWS S3 by redirecting the user to a signed URL.
    This is done to prevent exposing the AWS S3 bucket URL to the client.
    This endpoint is not supported by Swagger UI. To get a file, use the following URL in your browser:
    ${env.app.schema}://${env.app.host}:${env.app.port}/files?id=<fileId>
    The 'avatar' field in the user object and the 'image' field in the post object hold a file ID.
    `,
    security: [{ bearerAuth: [] }],
  })
  async getFile(
    @QueryParam("id", { required: true }) fileId: string,
    @Res() response: Response
  ): Promise<void> {
    let key = "",
      url = "";

    if (!isMongoId(fileId)) throwError(`Invalid file id: ${fileId}`, 400);

    this.setRequestId();
    this._logger.info(`Attempting to get file with id: ${fileId}`);

    try {
      const file = await this._fileRepository.getFileById(fileId);
      key = file.key;
      url = file.url;

      // Check if the file signed URL needs to be replaced
      if (file.updatedAt) {
        const currentDate = new Date(new Date().toUTCString());

        // Get difference in milliseconds between current date and file updated date
        const millisecondsDifference =
          currentDate.getTime() - file.updatedAt.getTime();

        // Get a new signed URL if the current one is almost expired (difference is greater than 270 seconds)
        // The signed URL expires after 300 seconds (5 minutes)
        if (millisecondsDifference > 270000) {
          this._logger.info("Creating a new signed URL for the file");

          // Make sure that the file exists before creating a new signed URL
          await this._fileService.getObject(file.key, env.awsS3.bucket);

          url = await this._fileService.getSignedURL(
            file.key,
            env.awsS3.bucket
          );

          // Update the file URL in the database
          await this._fileRepository.updateFile(file._id, url);
        }
      }
    } catch (error: any) {
      this._logger.error(error.message);
      throwError(`Failed to get file. ${error.message}`, 400);
    }

    this._logger.info(
      `Redirecting the user to the URL of the file with key: ${key}`
    );

    // Set response headers to prevent CORS errors when redirecting the user to the signed URL
    response.header("Cross-Origin-Resource-Policy", "same-site");
    response.header("Access-Control-Allow-Origin", env.frontend.url);
    response.header("Access-Control-Allow-Credentials", "true");

    // Redirect the user to the signed URL
    response.redirect(url);
  }
  // #endregion
}
