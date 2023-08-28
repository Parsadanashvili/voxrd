import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const ServerPage = async ({
  params,
}: {
  params: {
    id: string;
  };
}) => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/login");
  }

  const server = await db.server.findUnique({
    where: {
      id: params.id,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
    include: {
      channel: true,
    },
  });

  if (server) {
    return redirect(`/servers/${server.id}/channels/${server.channel[0].id}`);
  }

  return redirect(`/discover`);
};

export default ServerPage;
