import { Logger } from "../src/core/logger";
import { env } from "../src/core/config";
import { User } from "../src/models";
import { AuthHashProvider, MongodbConnectionProvider } from "../src/core";

const logger = new Logger(__filename);

// #region DATA -------------------------- YOUR INPUT IS NEEDED HERE----------------------------------------
const users = <User[]>[
  {
    username: "khaled_nabhan",
    password: "KhaledPassword.23",
    email: "khaled.nabhan@example.com",
    firstName: "Khaled",
    lastName: "Nabhan",
    verified: true,
  },
  {
    username: "khadija-khwais",
    password: "KhadijaPassword.23",
    email: "khadija.khwais@example.com",
    firstName: "Khadija",
    lastName: "Khwais",
    verified: true,
  },
  {
    username: "Bassel.al-Araj",
    password: "BasselPassword.23",
    email: "bassel.alaraj@example.com",
    firstName: "Bassel",
    lastName: "al-Araj",
    verified: true,
  },
  {
    username: "yahya_ayyash",
    password: "YahyaPassword.23",
    email: "yahya.ayyash@example.com",
    firstName: "Yahya",
    lastName: "Ayyash",
    verified: true,
  },
  {
    username: "LeilaKhaled",
    password: "LeilaPassword.23",
    email: "leila.khaled@example.com",
    firstName: "Leila",
    lastName: "Khaled",
    verified: true,
  },
  {
    username: "ahmad.ali.1",
    password: "AhmadPassword.23",
    email: "ahmad.ali@example.com",
    firstName: "Ahmad",
    lastName: "Ali",
    verified: false,
  },
];
// #endregion DATA -------------------------- YOUR INPUT IS NEEDED HERE----------------------------------------

async function main() {
  const hashingService = new AuthHashProvider();
  const mongodbService = new MongodbConnectionProvider(
    env.mongoDB.host,
    env.mongoDB.database,
    logger
  );

  await mongodbService.connect();

  // Wait a moment to make sure the connection is established.
  await new Promise<void>((done) => setTimeout(() => done(), 1000));

  logger.info("Data Input started...");

  const userModel = mongodbService.getModel(User, { timestamps: true });

  await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await hashingService.hashPassword(user.password);

      try {
        await userModel.create({
          ...user,
          password: hashedPassword,
        });

        logger.info(`The user ${user.username} was created successfully.`);
      } catch (error: any) {
        logger.error(
          `Failed to create user ${user.username}. Error: ${error.message}.`
        );
      }
    })
  );

  await mongodbService.closeConnection();
}

async function removeSeedData() {
  const mongodbService = new MongodbConnectionProvider(
    env.mongoDB.host,
    env.mongoDB.database,
    logger
  );

  await mongodbService.connect();

  // Wait a moment to make sure the connection is established.
  await new Promise<void>((done) => setTimeout(() => done(), 1000));

  logger.info("Seed Data Removal started...");

  const userModel = mongodbService.getModel(User, { timestamps: true });

  try {
    const usernames = users.map((user) => user.username);
    await userModel.deleteMany({
      username: { $in: usernames },
    });

    logger.info(`The users were deleted successfully.`);
  } catch (error: any) {
    logger.error(`Failed to delete users. Error: ${error.message}.`);
  }

  await mongodbService.closeConnection();
}

// Call the main function to seed the database.
main().then(() => {
  logger.info("Data Input finished.");
});

// Optional: Call the removeSeedData function to remove the seed data from the database.
// Make sure to comment out the main function call above.
// removeSeedData().then(() => {
//   logger.info("Seed Data Removal finished.");
// });
