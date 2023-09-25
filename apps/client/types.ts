import { Server, Socket } from "net";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: Server & {
      io: SocketIOServer;
    };
  };
};
