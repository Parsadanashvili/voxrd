"use client";

import { cn } from "@/lib/utils";
import { Channel, ChannelType, MemberRole, Server } from "@prisma/client";
import { Hash, Settings, Volume2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import ActionTooltip from "../ActionTooltip";
import useModal from "@/hooks/useModalStore";

interface ServerChannelProps {
  channel: Channel;
  server: Server;
  role?: MemberRole;
}

const iconMap = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.VOICE]: Volume2,
};

const ServerChannel = ({ channel, server, role }: ServerChannelProps) => {
  const { onOpen } = useModal();

  const params = useParams();
  const router = useRouter();

  const Icon = iconMap[channel.type];

  const onClick = () => {
    router.push(`/servers/${server.id}/channels/${channel.id}`);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group px-[10px] py-2 rounded-[5px] flex items-center gap-x-2 w-full text-[#8E8080] hover:bg-background hover:text-foreground dark:hover:bg-[#2F2A2A] transition",
        params?.channelId === channel.id &&
          "bg-background text-foreground dark:bg-[#2F2A2A]"
      )}
    >
      <Icon className="flex-shrink-0 w-4 h-4" />
      <p className={"line-clamp-1 font-medium text-sm"}>{channel.name}</p>
      {channel.name !== "general" && role !== MemberRole.GUEST && (
        <div className="ml-auto flex items-center gap-x-2">
          <ActionTooltip label="Edit Channel">
            <Settings
              onClick={() => onOpen("editChannel", { server })}
              className="invisible opacity-0 group-hover:visible group-hover:opacity-100 w-[14px] h-[14px] group-hover:text-foreground/80 transition"
            />
          </ActionTooltip>
        </div>
      )}
    </button>
  );
};

export default ServerChannel;
