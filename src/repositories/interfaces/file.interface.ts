import { File } from "../../models";

export interface IFileRepository {
  /**
   * Creates a new file
   * @param key key of the S3 file object
   * @param url pre-signed URL of the S3 file object
   * @returns created file
   */
  createFile(key: string, url: string): Promise<File>;

  /**
   * Updates a file
   * @param id id of the file to update
   * @param url updated pre-signed URL of the S3 file object
   * @returns updated file
   */
  updateFile(id: string, url: string): Promise<File>;

  /**
   * Deletes a file
   * @param id id of the file to delete
   */
  deleteFile(id: string): Promise<void>;

  /**
   * Gets a file by id
   * @param id id of the file to get
   * @returns the file
   */
  getFileById(id: string): Promise<File>;
}
