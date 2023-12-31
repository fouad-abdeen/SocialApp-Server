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

export class Express {
  readonly app: express.Application;
  private authService: AuthService;

  constructor(dirname: string) {
    this.app = express();

    this.app.use(httpContext.middleware);
    this.app.use(
      cors({
        origin: env.frontend.url,
        credentials: true,
      })
    );
    this.app.use(cookieParser());

    // Attach typedi container to routing-controllers
    useContainer(Container);

    this.configExpress(dirname);
    this.configHealthRoute();
    this.configSwaggerRoute(dirname);
  }

  configExpress(dirname: string) {
    this.app.listen(env.app.port);

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
