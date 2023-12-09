export interface IFileUploadProvider {
  /**
   * Uploads a file to AWS S3.
   * @param name File name (without extension)
   * @param fileExtension File extension (without dot)
   * @param content File content
   * @param bucket S3 bucket name
   * @param storagePath The storage path (optional, e.g. "avatars/") -
   * if not provided, the file will be uploaded to the root of the bucket
   * @param allowedExtensions Allowed file extensions (optional) - if not provided, any extension is allowed
   * @returns File info (URL and key)
   */
  uploadFile(
    name: string,
    fileExtension: string,
    content: unknown,
    bucket: string,
    storagePath?: string,
    allowedExtensions?: string[]
  ): Promise<FileInfo>;

  /**
   * Deletes a file from AWS S3.
   * @param key File key (storage path + name + extension)
   * @param bucket S3 bucket name
   */
  deleteFile(key: string, bucket: string): Promise<void>;

  /**
   * Gets an object from AWS S3.
   * @param key File key (storage path + name + extension)
   * @param bucket S3 bucket name
   * @returns File object
   */
  getObject(key: string, bucket: string): Promise<unknown>;

  /**
   * Generates a signed URL for a file in AWS S3.
   * @param key File key (storage path + name + extension)
   * @param bucket S3 bucket name
   * @param signedUrlExpireSeconds The number of seconds until the signed URL expires
   * @returns Signed URL
   */
  getSignedURL(
    key: string,
    bucket: string,
    signedUrlExpireSeconds: number
  ): Promise<string>;
}

export interface S3Credentials {
  /**
   * AWS access key ID
   */
  accessKeyId: string;

  /**
   * AWS secret access key
   */
  secretAccessKey: string;

  /**
   * A security or session token to use with these credentials.
   * Usually present for temporary credentials.
   */
  sessionToken?: string;

  /**
   * A {Date} when these credentials will no longer be accepted.
   */
  expiration?: Date;
}

export interface FileInfo {
  /**
   * Full URL of file
   */
  url: string;

  /**
   * Key of file (storage path + name + extension)
   */
  key: string;
}

export interface FileUpload {
  /**
   * Name of field in multipart request
   */
  fieldname: string;

  /**
   * Original file name
   */
  originalname: string;

  /**
   * Encoding of file e.g. 7bit
   */
  encoding: string;

  /**
   * Type of file e.g. image/png
   */
  mimetype: string;

  /**
   * File data
   */
  buffer: Buffer;

  /**
   * Size of file in bytes
   */
  size: number;
}
