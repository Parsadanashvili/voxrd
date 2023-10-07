"use client";

import { useAuth } from "@clerk/nextjs";
import { useSocket } from "./SocketProvider";

const WaitWsAndAuth = ({ children }: { children: React.ReactNode }) => {
  const { isConnected } = useSocket();
  const { isLoaded } = useAuth();

  if (!isConnected || !isLoaded) return <div>loading...</div>;

  return children;
};

export default WaitWsAndAuth;
