import { currentProfile } from "@/lib/current-profile";
import { ChannelType, MemberRole } from "@prisma/client";
import { ServerWithChannelWithMembers } from "./types";
import ServerHeader from "./ServerHeader";
import { redirect } from "next/navigation";
import { ScrollArea } from "../ui/scroll-area";
import ServerSearch from "./ServerSearch";
import { Hash, ShieldAlert, ShieldCheck, Volume2 } from "lucide-react";
import { Separator } from "../ui/separator";
import ServerSection from "./ServerSection";
import ServerChannel from "./ServerChannel";
import { db } from "@/lib/db";

interface ServerSidebarProps {
  serverId: string;
}

const iconMap = {
  [ChannelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
  [ChannelType.VOICE]: <Volume2 className="mr-2 h-4 w-4" />,
};

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: (
    <ShieldCheck className="h-4 w-4 mr-2 text-indigo-500" />
  ),
  [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 mr-2 text-primary" />,
};

const ServerSidebar = async ({ serverId }: ServerSidebarProps) => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/login");
  }

  const server = await db.server.findUnique({
    where: {
      id: serverId,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
    include: {
      channel: {
        orderBy: {
          createdAt: "asc",
        },
      },
      members: {
        include: {
          profile: true,
        },
        orderBy: {
          role: "asc",
        },
      },
    },
  });

  if (!server) {
    return redirect("/discover");
  }

  const textChannels = server.channel.filter(
    (channel) => channel.type === ChannelType.TEXT
  );
  const voiceChannels = server.channel.filter(
    (channel) => channel.type === ChannelType.VOICE
  );
  const members = server.members.filter(
    (member) => member.profileId !== profile.id
  );
  const role = server.members.find(
    (member) => member.profileId == profile.id
  )?.role;

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-t from-card to-card dark:bg-gradient-to-t dark:from-card dark:from-[46%] dark:via-card/[91] dark:via-[38%] dark:to-card/0 rounded-[10px] backdrop-blur-[30px]">
      <ServerHeader server={server} role={role} />
      <ScrollArea className="flex px-[5px]">
        <div className="mt-[10px]">
          <ServerSearch
            data={[
              {
                label: "Text Channels",
                type: "channel",
                data: textChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type],
                })),
              },
              {
                label: "Voice Channels",
                type: "channel",
                data: voiceChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type],
                })),
              },
              {
                label: "Members",
                type: "member",
                data: members?.map((member) => ({
                  id: member.id,
                  name: member.profile.username,
                  icon: roleIconMap[member.role],
                })),
              },
            ]}
          />
        </div>
        <div className="py-[5px] px-[15px]">
          <Separator className="bg-[#8E8080]" />
        </div>
        {!!textChannels.length && (
          <div className="mb-2">
            <ServerSection
              label={"Text Channels"}
              channelType={ChannelType.TEXT}
              role={role}
              server={server}
            />
            <div className="space-y-1">
              {textChannels.map((channel) => (
                <ServerChannel
                  key={channel.id}
                  server={server}
                  channel={channel}
                  role={role}
                />
              ))}
            </div>
          </div>
        )}
        {!!voiceChannels.length && (
          <div className="mb-2">
            <ServerSection
              label={"Voice Channels"}
              channelType={ChannelType.VOICE}
              role={role}
              server={server}
            />
            {voiceChannels.map((channel) => (
              <ServerChannel
                key={channel.id}
                server={server}
                channel={channel}
                role={role}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ServerSidebar;
