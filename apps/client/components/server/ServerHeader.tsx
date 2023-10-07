"use client";

import { MemberRole } from "@prisma/client";
import { ServerWithChannelWithMembers } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  ChevronDown,
  LogOut,
  PlusCircle,
  Settings,
  Trash,
  UserPlus,
  Users,
} from "lucide-react";
import Image from "next/image";
import Badge from "../icons/Badge";
import useModal from "@/hooks/useModalStore";

interface ServerHeaderProps {
  server: ServerWithChannelWithMembers;
  role?: MemberRole;
}

const ServerHeader = ({ server, role }: ServerHeaderProps) => {
  const { onOpen } = useModal();

  const isAdmin = role === MemberRole.ADMIN;
  const isModerator = isAdmin || role === MemberRole.MODERATOR;

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none" asChild>
          <button className="w-full text-xs font-bold p-[10px] flex items-center transition absolute top-0 left-0 z-10 text-white">
            <div className="flex items-center gap-1 ">
              <Badge />
              {server.name}
            </div>
            <ChevronDown className="h-4 w-4 ml-auto" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56 text-xs font-medium text-black dark:text-neutral-400 space-y-[2px]">
          {isModerator && (
            <DropdownMenuItem
              className="cursor-pointer text-primary"
              onClick={() => onOpen("invite", { server })}
            >
              Invite People
              <UserPlus className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onOpen("serverSettings", { server })}
            >
              Server Settings
              <Settings className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
          )}
          {isModerator && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onOpen("createChannel", { server })}
            >
              Create Channel
              <PlusCircle className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
          )}
          {isModerator && <DropdownMenuSeparator />}
          {isAdmin && (
            <DropdownMenuItem
              className="cursor-pointer text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onOpen("deleteServer", { server })}
            >
              Delete Server
              <Trash className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
          )}
          {!isAdmin && (
            <DropdownMenuItem
              className="cursor-pointer text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onOpen("leaveServer", { server })}
            >
              Leave Server
              <LogOut className="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative w-full h-[120px]">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-black/0 to-60% opacity-30 z-[8] rounded-[10px]" />
        <Image
          fill
          src={server.imageUrl}
          alt={server.name}
          objectFit="cover"
          className=" rounded-[10px]"
        />
      </div>
    </div>
  );
};

export default ServerHeader;
