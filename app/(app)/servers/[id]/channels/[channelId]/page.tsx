import Chat from "@/components/chat/Chat";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const ChannelPage = async ({
  params,
}: {
  params: {
    id: string;
    channelId: string;
  };
}) => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/login");
  }

  const { id, channelId } = params;

  const channel = await db.channel.findUnique({
    where: {
      id: channelId,
      serverId: id,
    },
  });

  const members = await db.member.findMany({
    where: {
      serverId: id,
    },
    include: {
      profile: true,
    },
  });

  const member = members.find((member) => member.profileId === profile.id);

  if (!channel || !member) {
    return redirect(`/servers/${id}`);
  }

  return (
    <Chat serverId={id} channel={channel} members={members} member={member} />
  );
};

export default ChannelPage;
