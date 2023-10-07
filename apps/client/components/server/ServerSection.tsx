"use client";

import { ChannelType, MemberRole } from "@prisma/client";
import { ServerWithChannelWithMembers } from "./types";
import ActionTooltip from "../ActionTooltip";
import { Plus } from "lucide-react";
import useModal from "@/hooks/useModalStore";

interface ServerSectionProps {
  label: string;
  role?: MemberRole;
  channelType: ChannelType;
  server?: ServerWithChannelWithMembers;
}

const ServerSection = ({
  label,
  role,
  channelType,
  server,
}: ServerSectionProps) => {
  const { onOpen } = useModal();

  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-[10px] uppercase font-bold text-[#8E8080] px-[5px] py-[5px]">
        {label}
      </p>

      {role !== MemberRole.GUEST && (
        <ActionTooltip label="Create Channel" side="top">
          <button
            className="text-foreground/80 hover:text-foreground px-[5px]"
            onClick={() => onOpen("createChannel", { server })}
          >
            <Plus className="h-4 w-4" />
          </button>
        </ActionTooltip>
      )}
    </div>
  );
};

export default ServerSection;
