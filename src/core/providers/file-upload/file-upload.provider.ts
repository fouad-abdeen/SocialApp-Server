import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { BaseService } from "../..";
import { FileInfo, IFileUploadProvider, S3Credentials } from "./";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class FileUploadProvider
  extends BaseService
  implements IFileUploadProvider
{
  protected instance: S3Client;
  private region: string;
  private endpoint?: string;

  /**
   * Creates an instance of File Upload Provider (AWS S3).
   * @param {S3Credentials} credentials AWS S3 credentials
   * @param {string} region AWS S3 region
   * @param {string} endpoint Optional: Custom AWS S3 endpoint
   */
  constructor(credentials: S3Credentials, region: string, endpoint?: string) {
    super(__filename);
    this.instance = new S3Client({
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      region,
      endpoint,
    });
    this.region = region;
    this.endpoint = endpoint;
  }

  async uploadFile(
    name: string,
    fileExtension: string,
    content: any,
    bucket: string,
    storagePath = "/",
    allowedExtensions?: string[]
  ): Promise<FileInfo> {
    const fileInfo = this.getFileInfo(
      name,
      fileExtension,
      bucket,
      storagePath,
      allowedExtensions
    );

    const uploadParams = {
      Bucket: bucket,
      Key: fileInfo.key,
      Body: content,
    };

    try {
      await this.instance.send(new PutObjectCommand(uploadParams));
      return fileInfo;
    } catch (error: any) {
      this._logger.error(`AWS error found. Error details: `, error.message);
      throw new Error(error.message);
    }
  }

  async deleteFile(key: string, bucket: string): Promise<void> {
    const params = { Key: key, Bucket: bucket };

    try {
      await this.instance.send(new DeleteObjectCommand(params));
    } catch (error: any) {
      this._logger.error(`AWS error found. Error details: `, error.message);
      throw new Error(error.message);
    }
  }

  async getObject(key: string, bucket: string): Promise<unknown> {
    const params = { Key: key, Bucket: bucket };

    try {
      const command = new GetObjectCommand(params);

      const object = await this.instance.send(command);

      return object;
    } catch (error: any) {
      this._logger.error(`AWS error found. Error details: `, error.message);
      throw new Error(error.message);
    }
  }

  async getSignedURL(
    key: string,
    bucket: string,
    signedUrlExpireSeconds = 300
  ): Promise<string> {
    const params = { Key: key, Bucket: bucket };

    try {
      const command = new GetObjectCommand(params);

      const signedUrl = await getSignedUrl(this.instance, command, {
        expiresIn: signedUrlExpireSeconds,
      });

      return signedUrl;
    } catch (error: any) {
      this._logger.error(`AWS error found. Error details: `, error.message);
      throw new Error(error.message);
    }
  }

  private getFileInfo(
    name: string,
    fileExtension: string,
    bucket: string,
    storagePath: string,
    allowedExtensions?: string[]
  ): FileInfo {
    // const filename = `${name}.${fileExtension}`;
    const fileKey = `${storagePath}${name}`;

    if (allowedExtensions) {
      fileExtension = fileExtension.toLowerCase();
      allowedExtensions = allowedExtensions.map((extension) =>
        extension.toLowerCase()
      );

      const allowedExtensionsString = allowedExtensions.join(", ");

      if (allowedExtensions.indexOf(fileExtension) === -1)
        throw new Error(
          `Cannot upload a file with the extension ${fileExtension}.` +
            ` Only files of the following extensions are allowed: ${allowedExtensionsString}`
        );
    }

    const fileInfo: FileInfo = {
      url:
        (this.endpoint ?? `s3-${this.region}.amazonaws.com`) +
        `/${bucket}/${fileKey}`,
      key: fileKey,
    };

    return fileInfo;
  }
}
