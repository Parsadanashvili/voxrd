import "dotenv/config";

import express, { Request } from "express";
import cors from "cors";
import http from "http";
import config from "./config";
import path from "path";

import { v4 as uuidv4 } from "uuid";

import { Server as IOServer } from "socket.io";

import { ClerkExpressWithAuth, LooseAuthProp } from "@clerk/clerk-sdk-node";
import { db } from "./libs/db";
import { currentProfile } from "./libs/current-profile";
import { MemberRole, Message } from "@prisma/client";

const app = express();
const httpServer = http.createServer(app);

const apiBasePath = "/api";

const io = new IOServer(httpServer);

declare global {
  namespace Express {
    interface Request extends LooseAuthProp {}
  }
}

const MESSAGE_BATCH = 12;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../", "public")));

app.use(
  ClerkExpressWithAuth({
    onError: () => {
      console.log("error");
    },
  })
);

app.post(apiBasePath + "/servers", async (req: Request, res) => {
  try {
    const { name, imageUrl } = await req.body;

    if (!req.auth.userId) {
      return res.status(401).send("Unauthorized");
    }

    const profile = await currentProfile(req.auth.userId);

    if (!profile) {
      return res.status(401).send("Unauthorized");
    }

    const server = await db.server.create({
      data: {
        profileId: profile.id,
        name,
        imageUrl,
        inviteCode: uuidv4(),
        channel: {
          create: [
            {
              name: "general",
              profileId: profile.id,
            },
          ],
        },
        members: {
          create: [
            {
              profileId: profile.id,
              role: MemberRole.ADMIN,
            },
          ],
        },
      },
    });

    return res.json(server);
  } catch (e) {
    return res.status(500).send("Internal Error");
  }
});

app.patch(apiBasePath + "/servers/:serverId", async (req: Request, res) => {
  try {
    const { serverId } = req.params;
    const { name, imageUrl } = req.body;

    if (!req.auth.userId) {
      return res.status(401).send("Unauthorized");
    }

    const profile = await currentProfile(req.auth.userId);

    if (!profile) {
      return res.status(401).send("Unauthorized");
    }

    const updateData: {
      name: string;
      imageUrl?: string;
    } = { name };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const server = await db.server.update({
      data: updateData,
      where: {
        id: serverId,
        profileId: profile.id,
      },
    });

    return res.json(server);
  } catch (e) {
    return res.status(500).send("Internal Error");
  }
});

app.delete(apiBasePath + "/servers/:serverId", async (req: Request, res) => {
  try {
    const { serverId } = req.params;

    if (!req.auth.userId) {
      return res.status(401).send("Unauthorized");
    }

    const profile = await currentProfile(req.auth.userId);

    if (!profile) {
      return res.status(401).send("Unauthorized");
    }

    const server = await db.server.delete({
      where: {
        id: serverId,
        profileId: profile.id,
      },
    });

    return res.json(server);
  } catch (e) {
    return res.status(500).send("Internal Error");
  }
});

app.post(
  apiBasePath + "/servers/:serverId/channels",
  async (req: Request, res) => {
    try {
      if (!req.auth.userId) {
        return res.status(401).send("Unauthorized");
      }

      const profile = await currentProfile(req.auth.userId);

      if (!profile) {
        return res.status(401).send("Unauthorized");
      }

      const { name, type } = req.body;
      const { serverId } = req.params;

      if (name === "general") {
        return res.status(400).send("Name cannot be 'general'");
      }

      const server = await db.server.update({
        where: {
          id: serverId,
          members: {
            some: {
              profileId: profile.id,
              role: {
                in: [MemberRole.ADMIN, MemberRole.MODERATOR],
              },
            },
          },
        },
        data: {
          channel: {
            create: {
              name,
              type,
              profileId: profile.id,
            },
          },
        },
      });

      return res.json(server);
    } catch (e) {
      return res.status(500).send("Internal Error");
    }
  }
);

app.get(
  apiBasePath + "/servers/:serverId/channels/:channelId/messages",
  async (req: Request, res) => {
    console.log("messages");

    try {
      if (!req.auth.userId) {
        console.log("Unauthorized");

        return res.status(401).send("Unauthorized");
      }

      const profile = await currentProfile(req.auth.userId);

      if (!profile) {
        console.log("Unauthorized 2");
        return res.status(401).send("Unauthorized");
      }

      const { serverId, channelId } = req.params;
      const { cursor } = req.query;

      if (!serverId || !channelId) {
        return res.status(404).send("Not Found");
      }

      let messages: Message[] = [];

      if (cursor) {
        messages = await db.message.findMany({
          take: MESSAGE_BATCH,
          skip: 1,
          cursor: {
            id: cursor as string,
          },
          where: {
            channelId,
          },
          include: {
            member: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      } else {
        messages = await db.message.findMany({
          take: MESSAGE_BATCH,
          where: {
            channelId,
          },
          include: {
            member: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      }

      let nextCursor = null;

      if (messages.length === MESSAGE_BATCH) {
        nextCursor = messages[MESSAGE_BATCH - 1].id;
      }

      return res.json({
        items: messages,
        nextCursor,
      });
    } catch (e) {
      console.log(e);

      return res.status(500).send("Internal Error");
    }
  }
);

app.post(
  apiBasePath + "/servers/:serverId/channels/:channelId/messages",
  async (req: Request, res) => {
    try {
      if (!req.auth.userId) {
        return res.status(401).send("Unauthorized");
      }

      const profile = await currentProfile(req.auth.userId);

      if (!profile) {
        return res.status(401).send("Unauthorized");
      }

      const { content, fileUrl } = req.body;
      const { serverId, channelId } = req.params;

      if (!serverId || !channelId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!content) {
        return res.status(400).json({ message: "Content missing" });
      }

      const server = await db.server.findFirst({
        where: {
          id: serverId as string,
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
          serverId: serverId as string,
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

      // TODO:send socket
      // res?.socket?.server?.io?.emit(channelKey, message);

      return res.status(200).json(message);
    } catch (e) {
      console.log(e);

      return res.status(500).json({ message: "Internal Error" });
    }
  }
);

app.patch(
  apiBasePath + "/servers/:serverId/channels/:channelId/messages/:messageId",
  async (req: Request, res) => {
    if (!req.auth.userId) {
      return res.status(401).send("Unauthorized");
    }

    const profile = await currentProfile(req.auth.userId);

    if (!profile) {
      return res.status(401).send("Unauthorized");
    }

    const { content } = req.body;
    const { serverId, channelId, messageId } = req.params;

    if (!profile || !serverId || !channelId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
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
        serverId: serverId as string,
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

    let message = await db.message.findFirst({
      where: {
        id: messageId as string,
        channelId: channelId as string,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!message || message.deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    const isMessageOwner = message.memberId === member.id;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;
    const canModify = isMessageOwner || isAdmin || isModerator;

    if (!canModify) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isMessageOwner) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    message = await db.message.update({
      where: {
        id: messageId as string,
      },
      data: {
        content,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    const updateKey = `chat:${channelId}:messages:update`;

    // TODO:send socket
    // res?.socket?.server?.io.emit(updateKey, message);

    return res.status(200).json(message);
  }
);

app.delete(
  apiBasePath + "/servers/:serverId/channels/:channelId/messages/:messageId",
  async (req: Request, res) => {
    if (!req.auth.userId) {
      return res.status(401).send("Unauthorized");
    }

    const profile = await currentProfile(req.auth.userId);

    if (!profile) {
      return res.status(401).send("Unauthorized");
    }

    const { content } = req.body;
    const { serverId, channelId, messageId } = req.params;

    if (!profile || !serverId || !channelId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
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
        serverId: serverId as string,
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

    let message = await db.message.findFirst({
      where: {
        id: messageId as string,
        channelId: channelId as string,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!message || message.deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    const isMessageOwner = message.memberId === member.id;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;
    const canModify = isMessageOwner || isAdmin || isModerator;

    if (!canModify) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    message = await db.message.update({
      where: {
        id: messageId as string,
      },
      data: {
        fileUrl: null,
        content: "This message has been deleted.",
        deleted: true,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    const updateKey = `chat:${channelId}:messages:update`;

    // TODO:send socket
    // res?.socket?.server?.io.emit(updateKey, message);

    return res.status(200).json(message);
  }
);

app.post(
  apiBasePath + "/servers/:serverId/leave",
  async (req: Request, res) => {
    try {
      if (!req.auth.userId) {
        return res.status(401).send("Unauthorized");
      }

      const profile = await currentProfile(req.auth.userId);

      if (!profile) {
        return res.status(401).send("Unauthorized");
      }

      const { serverId } = req.params;

      const server = await db.server.update({
        where: {
          id: serverId,
          profileId: {
            not: profile.id,
          },
          members: {
            some: {
              profileId: profile.id,
            },
          },
        },
        data: {
          members: {
            deleteMany: {
              profileId: profile.id,
            },
          },
        },
      });

      return res.json(server);
    } catch (e) {
      return res.status(500).send("Internal Error");
    }
  }
);

app.patch(
  apiBasePath + "/servers/:serverId/members/:memberId",
  async (req: Request, res) => {
    try {
      const { serverId, memberId } = req.params;
      const { role } = req.body;

      if (!req.auth.userId) {
        return res.status(401).send("Unauthorized");
      }

      const profile = await currentProfile(req.auth.userId);

      if (!profile) {
        return res.status(401).send("Unauthorized");
      }

      const server = await db.server.update({
        where: {
          id: serverId,
          profileId: profile.id,
        },
        data: {
          members: {
            update: {
              where: {
                id: memberId,
                profileId: {
                  not: profile.id,
                },
              },
              data: {
                role,
              },
            },
          },
        },
        include: {
          members: {
            include: {
              profile: true,
            },
            orderBy: {
              role: "asc",
            },
          },
          channel: true,
        },
      });

      return res.json(server);
    } catch (e) {
      return res.status(500).send("Internal Error");
    }
  }
);

app.delete(
  apiBasePath + "/servers/:serverId/members/:memberId",
  async (req: Request, res) => {
    try {
      if (!req.auth.userId) {
        return res.status(401).send("Unauthorized");
      }

      const profile = await currentProfile(req.auth.userId);

      if (!profile) {
        return res.status(401).send("Unauthorized");
      }

      const { serverId, memberId } = req.params;

      const server = await db.server.update({
        where: {
          id: serverId,
          profileId: profile.id,
        },
        data: {
          members: {
            deleteMany: {
              id: memberId,
              profileId: {
                not: profile.id,
              },
            },
          },
        },
        include: {
          members: {
            include: {
              profile: true,
            },
            orderBy: {
              role: "asc",
            },
          },
          channel: true,
        },
      });

      return res.json(server);
    } catch (e) {
      return res.status(500).send("Internal Error");
    }
  }
);

httpServer.listen(config.port, () => {
  console.log("🚀 Server ready at: http://localhost:" + config.port);
});

io.on("connection", (socket) => {
  socket.on("join", async (data, cb) => {
    const peer_ip =
      socket.handshake.headers["x-forwarded-for"] || socket.conn.remoteAddress;
  });
});
