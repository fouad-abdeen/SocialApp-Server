import * as dotenv from "dotenv";

dotenv.config();

function getEnvVariable(name: string, fallback?: string): string {
  const envVariable = process.env[name];
  const fallbackProvided = typeof fallback === "string";

  if (!envVariable && !fallbackProvided)
    throw new Error(`Environment variable ${name} has not been set.`);

  return envVariable || fallback || "";
}

export const env = {
  nodeEnv: getEnvVariable("NODE_ENV", "development"),

  log: {
    /**
     * Output level of logger (winston)
     * { debug, info, warning, error}: see: https://github.com/winstonjs/winston#logging-levels
     */
    level: getEnvVariable("LOG_LEVEL", "info"),
    /**
     * Output of morgan
     * { dev, short } see: https://github.com/expressjs/morgan#predefined-formats
     */
    output: getEnvVariable("APP_SCHEMA", "dev"),
  },

  app: {
    name: getEnvVariable("APP_NAME", "SocialApp"),
    version: getEnvVariable("APP_VERSION", "1.0.0"),
    description: getEnvVariable("APP_DESCRIPTION", "A simple social media app"),
    schema: getEnvVariable("APP_SCHEMA", "http"),
    host: getEnvVariable("APP_HOST", "localhost"),
    port: getEnvVariable("APP_PORT", "3030"),
    routePrefix: getEnvVariable("APP_ROUTE_PREFIX", ""),
  },

  mongoDB: {
    host: getEnvVariable("MONGODB_HOST", "mongodb://127.0.0.1:27017/"),
    database: getEnvVariable("MONGODB_DATABASE", "social-app"),
  },

  auth: {
    hashingSaltRounds: parseInt(
      getEnvVariable("AUTH_HASHING_SALT_ROUNDS", "10")
    ),
    jwtSecretKey: getEnvVariable("JWT_SECRET_KEY"),
    accessTokenExpiresIn: getEnvVariable("JWT_ACCESS_TOKEN_EXPIRES_IN", "1h"),
    refreshTokenExpiresIn: getEnvVariable("JWT_REFRESH_TOKEN_EXPIRES_IN", "1d"),
    emailVerificationTokenExpiresIn: getEnvVariable(
      "JWT_EMAIL_VERIFICATION_TOKEN_EXPIRES_IN",
      "1d"
    ),
    passwordResetTokenExpiresIn: getEnvVariable(
      "JWT_PASSWORD_RESET_TOKEN_EXPIRES_IN",
      "6h"
    ),
  },

  frontend: {
    url: getEnvVariable("FRONTEND_URL", "http://localhost:5173"),
    emailVerificationUrl: getEnvVariable(
      "FRONTEND_EMAIL_VERIFICATION_URL",
      "http://localhost:5173/email-verification"
    ),
    passwordResetUrl: getEnvVariable(
      "FRONTEND_PASSWORD_RESET_URL",
      "http://localhost:5173/reset-password"
    ),
  },

  mail: {
    senderName: getEnvVariable("BREVO_SENDER_NAME", "Fouad at SocialApp"),
    senderMailAddress: getEnvVariable(
      "BREVO_SENDER_MAIL_ADDRESS",
      "fouad.abdine@gmail.com"
    ),
    brevoApiUrl: getEnvVariable(
      "BREVO_API_URL",
      "https://api.brevo.com/v3/smtp/email"
    ),
    brevoApiKey: getEnvVariable("BREVO_API_KEY"),
  },

  awsS3: {
    accessKeyId: getEnvVariable("AWS_S3_ACCESS_KEY_ID"),
    secretAccessKey: getEnvVariable("AWS_S3_SECRET_ACCESS_KEY"),
    region: getEnvVariable("AWS_S3_REGION", "global"),
    endpoint: getEnvVariable("AWS_S3_ENDPOINT", "https://s3.tebi.io"),
    bucket: getEnvVariable("AWS_S3_BUCKET_NAME", "social-app"),
  },
};
