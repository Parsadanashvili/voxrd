import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { NextApiResponseServerIo } from "@/types";
import { NextApiRequest } from "next";

const handleMessage = async (
  req: NextApiRequest,
  res: NextApiResponseServerIo
) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfilePages(req);

    const { content, fileUrl } = req.body;
    const { id, channelId } = req.query;

    if (!profile || !id || !channelId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!content) {
      return res.status(400).json({ message: "Content missing" });
    }

    const server = await db.server.findFirst({
      where: {
        id: id as string,
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!server) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: id as string,
      },
    });

    if (!channel) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const member = server.members.find(
      (member) => member.profileId === profile.id
    );

    if (!member) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const message = await db.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId as string,
        memberId: member.id,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    const channelKey = `chat:${channelId}:messages`;

    res?.socket?.server?.io?.emit(channelKey, message);

    return res.status(200).json(message);
  } catch (e) {
    console.log(e);

    return res.status(500).json({ message: "Internal Error" });
  }
};

export default handleMessage;
