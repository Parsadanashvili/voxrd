import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { redirect } from "next/navigation";

const InvitePage = async ({
  params,
}: {
  params: {
    code: string;
  };
}) => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/login");
  }

  const existingServer = await db.server.findUnique({
    where: {
      inviteCode: params.code,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  if (existingServer) {
    return redirect(`/servers/${existingServer.id}`);
  }

  const server = await db.server.update({
    where: {
      inviteCode: params.code,
    },
    data: {
      members: {
        create: {
          profileId: profile.id,
          role: MemberRole.GUEST,
        },
      },
    },
  });

  return redirect(`/servers/${server.id}`);
};

export default InvitePage;
