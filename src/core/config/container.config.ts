import { Container } from "typedi";
import {
  AuthHashProvider,
  Logger,
  MailProvider,
  MongodbConnectionProvider,
  SocketConnectionProvider,
  env,
} from "..";
import { AuthTokenProvider } from "../providers/auth/auth-token.provider";
import { FileUploadProvider } from "../providers/file-upload";

/**
 * Registers services in container
 * Used for dependency injection
 */
export const registerServices = async (logger: Logger) => {
  logger.info("Registering Bcrypt Service");
  Container.set(AuthHashProvider, new AuthHashProvider());

  logger.info("Registering JWT Service");
  Container.set(
    AuthTokenProvider,
    new AuthTokenProvider(env.auth.jwtSecretKey)
  );

  logger.info("Registering Mail Service");
  Container.set(
    MailProvider,
    new MailProvider(env.mail.brevoApiUrl, env.mail.brevoApiKey, {
      name: env.mail.senderName,
      email: env.mail.senderMailAddress,
    })
  );

  logger.info("Registering Socket Service");
  Container.set(
    SocketConnectionProvider,
    new SocketConnectionProvider(logger, env.frontend.url)
  );

  logger.info("Registering File Upload Service");
  Container.set(
    FileUploadProvider,
    new FileUploadProvider(
      {
        accessKeyId: env.awsS3.accessKeyId,
        secretAccessKey: env.awsS3.secretAccessKey,
      },
      env.awsS3.region,
      env.awsS3.endpoint
    )
  );

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
