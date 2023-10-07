import { db } from "./db";

export const currentProfile = async (userId: string) => {
  if (!userId) {
    return null;
  }

  const profile = await db.profile.findUnique({
    where: {
      userId,
    },
  });

  return profile;
};
