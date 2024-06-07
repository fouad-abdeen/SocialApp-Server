import express from "express";
import * as httpContext from "express-http-context";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Action, useContainer, useExpressServer } from "routing-controllers";
import { Container } from "typedi";
import swaggerUiExpress from "swagger-ui-express";
import { getSwaggerSpec } from "./swagger.config";
import { env } from ".";
import { AuthService } from "../../services";
import { Logger } from "..";
import { Server, createServer } from "http";
import { registerServices } from "./container.config";

export class Express {
  private readonly app: express.Application;
  private readonly server: Server;
  private authService: AuthService;

  constructor(dirname: string, logger: Logger) {
    this.app = express();
    this.server = createServer(this.app);

    registerServices(this.server, logger).then(() => {
      this.app.use(httpContext.middleware);
      this.app.use(
        cors({
          origin: env.frontend.url,
          methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          allowedHeaders: ["Content-Type"],
          exposedHeaders: ["Set-Cookie"],
          credentials: true,
        })
      );
      this.app.use(cookieParser());

      // Attach typedi container to routing-controllers
      useContainer(Container);

      this.configExpress(dirname);
      this.configHealthRoute();
      this.configSwaggerRoute(dirname);
    });
  }

  configExpress(dirname: string) {
    this.server.listen(env.app.port);

    useExpressServer(this.app, {
      cors: true,
      classTransformer: true,
      defaultErrorHandler: false,
      routePrefix: env.app.routePrefix,

      controllers: [dirname + "/controllers/*.ts"],
      middlewares: [dirname + "/core/middlewares/*.ts"],
      interceptors: [dirname + "/core/interceptors/*.ts"],

      authorizationChecker: async (action: Action) => {
        if (!this.authService) this.authService = Container.get(AuthService);
        await this.authService.authorizeUser(action);
        return true;
      },
    });
  }

  configHealthRoute() {
    this.app.get("/health", (req: express.Request, res: express.Response) => {
      res.json({
        name: env.app.name,
        version: env.app.version,
        description: env.app.description,
      });
    });
  }

  configSwaggerRoute(dirname: string) {
    this.app.use(
      "/docs",
      swaggerUiExpress.serve,
      swaggerUiExpress.setup(getSwaggerSpec(dirname))
    );
  }
}
