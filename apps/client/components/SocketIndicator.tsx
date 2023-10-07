"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./providers/SocketProvider";
import { Badge } from "./ui/badge";

const SocketIndicator = () => {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useSocket();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <></>;
  }

  if (!isConnected) {
    return (
      <Badge
        variant={"outline"}
        className="bg-yellow-600 text-white border-none"
      >
        Fallback: Polling every 1s
      </Badge>
    );
  }

  return (
    <Badge
      variant={"outline"}
      className="bg-emerald-600 text-white border-none"
    >
      Live: Real-time updates
    </Badge>
  );
};

export default SocketIndicator;
