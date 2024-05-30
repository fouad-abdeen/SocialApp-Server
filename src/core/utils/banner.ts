import { Logger, env } from "..";

export function displayBanner(log: Logger): void {
  const route = `${env.app.schema}://${env.app.host}:${env.app.port}`;
  log.info("-------------------------------------------------------");
  log.info(`The app is ready on ${route}${env.app.routePrefix}`);
  log.info(`To shut it down, press <CTRL> + C at any time.`);
  log.info(``);
  log.info("-------------------------------------------------------");
  log.info(`Service      : ${env.app.name}`);
  log.info(`Environment  : ${env.nodeEnv}`);
  log.info(`Version      : ${env.app.version}`);
  log.info(``);
  log.info(`Health API   : ${route}${env.app.routePrefix}/health`);
  log.info(`Docs API     : ${route}${env.app.routePrefix}/docs`);
  log.info(
    `Socket.IO server is running on ${route}${env.webSocket.socketIoPath}`
  );
  log.info("-------------------------------------------------------\n");
}
