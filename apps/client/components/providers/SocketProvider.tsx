"use client";

import { useAuth } from "@clerk/nextjs";
import { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io";
import { io as ClientIO } from "socket.io-client";

type SocketContextType = {
  socket: any | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance: Socket = new (ClientIO as any)(
      process.env.NEXT_PUBLIC_SOCKET_URL!,
      {
        path: "/io",
      }
    );

    socketInstance.on("connect", () => {
      // setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && isLoaded && isSignedIn) {
      (async () => {
        socket.emit(
          "@auth-token",
          {
            token: await getToken(),
          },
          (
            data:
              | {
                  message: string;
                  error: undefined;
                }
              | {
                  error: string;
                }
          ) => {
            if (data.error) {
              setIsConnected(false);
              return;
            }

            setIsConnected(true);
          }
        );
      })();
    }
  }, [socket, isLoaded, isSignedIn, getToken]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
