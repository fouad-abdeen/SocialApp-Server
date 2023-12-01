import { User } from "../../models";

export interface IUserRepository {
  /**
   * Creates a new user
   * @param user user to create
   */
  createUser(user: User): Promise<User>;

  /**
   * Updates an existing user
   * @param user user to update
   */
  updateUser(user: User): Promise<User>;

  /**
   * Gets a user by username
   * @param username username to find user by
   */
  getUserByUsername(username: string): Promise<User>;

  /**
   * Gets a user by email
   * @param email email to find user by
   */
  getUserByEmail(email: string): Promise<User>;
}
