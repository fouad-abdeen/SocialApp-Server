import { Server } from "http";
import { Server as SocketIoServer } from "socket.io";
import { BaseService } from "../../../base.service";
import { Logger } from "../../../logger";
import { env } from "../../..";

export class SocketConnectionProvider extends BaseService {
  readonly socketIoServer: SocketIoServer;

  constructor(server: Server, corsOrigin: string, logger?: Logger) {
    super(__filename, logger);
    this.socketIoServer = this.createSocketServer(server, corsOrigin);
  }

  private createSocketServer(
    server: Server,
    corsOrigin: string
  ): SocketIoServer {
    const socketIo = new SocketIoServer(server, {
      path: env.webSocket.socketIoPath,
      cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
      },
    });

    socketIo.on("connection", (socket) => {
      // Get the attached userId from the socket handshake
      const userId = socket.handshake.auth.userId;
      // Group sockets by userId using rooms for efficient messaging
      socket.join(userId);
    });

    return socketIo;
  }
}
