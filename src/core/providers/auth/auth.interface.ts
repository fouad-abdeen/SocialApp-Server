export interface IAuthHashProvider {
  /**
   * Hashes a password
   * @param password password to hash
   * @returns hashed password
   */
  hashPassword(password: string): string;

  /**
   * Verifies a password against a hashed password
   * @param password password to verify
   * @param hash hashed password
   * @returns true if the password matches the hashed password and false otherwise
   */
  verifyPassword(password: string, hash: string): boolean;
}
