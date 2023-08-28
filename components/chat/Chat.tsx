import { Channel, Member as MemberBase, Profile } from "@prisma/client";
import ChatHeader from "./ChatHeader";
import ChatMembers from "./ChatMembers";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

type Member = MemberBase & {
  profile: Profile;
};

interface ChatProps {
  serverId: string;
  channel: Channel;
  members: Member[];
  member: Member;
}

const Chat = ({ serverId, channel, members, member }: ChatProps) => {
  return (
    <>
      <div className="flex flex-col flex-1 p-[10px]">
        <ChatHeader
          serverId={serverId}
          name={channel.name}
          onMembersToggle={(open) => {}}
        />
        <ChatMessages
          apiUrl={`/api/servers/${serverId}/channels/${channel.id}/messages`}
          chatId={channel.id}
          name={channel.name}
          member={member}
          socketUrl={`/api/socket/servers/${serverId}/channels/${channel.id}/messages`}
        />
        <ChatInput
          apiUrl={`/api/socket/servers/${serverId}/channels/${channel.id}/messages`}
          name={channel.name}
          query={{
            channelId: channel.id,
            serverId: serverId,
          }}
        />
      </div>
      <div className="hidden lg:block py-[10px]">{/* <ChatMembers /> */}</div>
    </>
  );
};

export default Chat;