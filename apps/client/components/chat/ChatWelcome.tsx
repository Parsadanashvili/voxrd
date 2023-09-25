"use client";

import { Hash } from "lucide-react";

const ChatWelcome = ({ name }: { name: string }) => {
  return (
    <div className="mb-4">
      <div className="h-[75px] w-[75px] rounded-full flex items-center justify-center bg-card mb-2">
        <Hash className="h-12 w-12 text-card-foreground" />
      </div>
      <h3 className="text-xl md:text-3xl font-bold mb-1">Welcome to #{name}</h3>
      <p className="text-base text-card-foreground/80">
        This is the start of #{name} channel.
      </p>
    </div>
  );
};

export default ChatWelcome;
