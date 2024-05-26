import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { BaseService } from "../../../base.service";
import { Logger } from "../../../logger";
import { env } from "../../..";

export class SocketConnectionProvider extends BaseService {
  readonly socketIoServer: Server;

  constructor(logger: Logger, corsOrigin: string) {
    super(__filename, logger);
    this.socketIoServer = this.createSocketServer(corsOrigin);
    logger.info(`Socket.io server running on port ${env.webSocket.serverPort}`);
  }

  private createSocketServer(corsOrigin: string): Server {
    const app = express();
    const socketIo = new Server(createServer(app), {
      path: "/socket/",
      cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
      },
    });

    socketIo.listen(+env.webSocket.serverPort);

    socketIo.on("connection", (socket) => {
      // Get the attached userId from the socket handshake
      const userId = socket.handshake.auth.userId;
      // Group sockets by userId using rooms for efficient messaging
      socket.join(userId);
    });

    return socketIo;
  }
}
