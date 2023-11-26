import { Container } from "typedi";
import { Logger, MongodbConnectionProvider, env } from "..";

/**
 * Registers services in container
 * Used for dependency injection
 */
export const registerServices = async (logger: Logger) => {
  // #region Setting MongoDB Connection
  logger.info("Registering MongoDB Service");

  const mongodbService = new MongodbConnectionProvider(
    env.mongoDB.host,
    env.mongoDB.database,
    logger
  );

  // Singleton MongoDB Connection
  await mongodbService.connect();

  // Gracefully close MongoDB connection when the app is stopped or crashed
  const mongodbGracefulExit = async () => {
    await mongodbService.closeConnection();
    process.exit(0);
  };

  // Listen for signals to gracefully close the MongoDB connection
  process.on("SIGINT", mongodbGracefulExit); // Interrupt from keyboard (ctrl + c)
  process.on("SIGTERM", mongodbGracefulExit); // Termination signal

  Container.set(MongodbConnectionProvider, mongodbService);
  // #endregion
};
