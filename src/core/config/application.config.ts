import { Express } from "./express.config";
import { registerServices } from "./container.config";
import { Logger } from "..";
import { displayBanner } from "../utils/banner";

/**
 * Main application class
 * Creates the express server, launches it , and displays the banner.
 */
export class Application {
  express: Express;

  constructor(dirname: string) {
    const log = new Logger("App");
    log.info("Starting...");

    this.express = new Express(dirname);

    registerServices(log);

    displayBanner(log);
  }
}
