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
  },
};
