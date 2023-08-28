import { currentUser } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const initialProfile = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/login");
  }

  const profile = await db.profile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (profile) {
    return profile;
  }

  const newProfile = await db.profile.create({
    data: {
      userId: user.id,
      username: `${user.username}`,
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
    },
  });

  return newProfile;
};
