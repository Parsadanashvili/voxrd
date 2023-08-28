import { db } from "@/lib/db";
import { initialProfile } from "@/lib/initial-profile";
import { redirect } from "next/navigation";

const SetupPage = async () => {
  const profile = await initialProfile();

  const servers = await db.server.findMany({
    where: {
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  if (servers.length > 0) {
    return redirect(`/servers/${servers[0].id}`);
  }

  return redirect(`/discover`);
};

export default SetupPage;
