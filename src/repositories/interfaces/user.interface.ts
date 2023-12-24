import { User } from "../../models";
import { Pagination } from "../../shared/pagination.model";

export interface IUserRepository {
  /**
   * Creates a new user
   * @param user user to create
   * @returns created user
   */
  createUser(user: User): Promise<User>;

  /**
   * Updates an existing user
   * @param user user to update
   * @returns updated user
   */
  updateUser(user: User): Promise<User>;

  /**
   * Gets a user by id
   * @param id id to find user by
   * @param projection fields to return
   * @returns found user
   */
  getUserById(id: string, projection?: string): Promise<User>;

  /**
   * Gets a user by email
   * @param email email to find user by
   * @returns found user
   */
  getUserByEmail(email: string): Promise<User>;

  /**
   * Gets a user by username
   * @param username username to find user by
   * @returns found user
   */
  getUserByUsername(username: string): Promise<User>;

  /**
   * Searches for users by username
   * @param usernameQuery username to search for
   * @param pagination pagination options
   * @returns found users
   */
  searchUsersByUsername(
    usernameQuery: string,
    pagination: Pagination
  ): Promise<User[]>;
}
