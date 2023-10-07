import { db } from "./db";

export const getVoiceChannel = async (id: string) => {
  if (!id) return null;

  return await db.channel.findFirst({
    where: {
      id,
      type: "VOICE",
    },
  });
};
