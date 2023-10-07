import "dotenv/config";

import express, { Request } from "express";
import cors from "cors";
import http from "http";
import config from "./config";
import path from "path";

import { v4 as uuidv4 } from "uuid";

import { Server as IOServer } from "socket.io";

import * as mediasoup from "mediasoup";

import {
  ClerkExpressWithAuth,
  LooseAuthProp,
  decodeJwt,
} from "@clerk/clerk-sdk-node";
import { db } from "./libs/db";
import { currentProfile } from "./libs/current-profile";
import { MemberRole, Message, Profile } from "@prisma/client";
import { Worker } from "mediasoup/node/lib/Worker";
import { getVoiceChannel } from "./libs/get-voice-channel";
import VoiceChannel from "./VoiceChannel";
import Peer from "./Peer";
import { DtlsParameters } from "mediasoup/node/lib/WebRtcTransport";
import { MediaKind, RtpParameters } from "mediasoup/node/lib/RtpParameters";
import { AppData } from "mediasoup/node/lib/types";

const app = express();
const httpServer = http.createServer(app);

const apiBasePath = "/api";

const io = new IOServer(httpServer, {
  path: "/io",
  cors: {
    origin: "*",
  },
});

let VoiceChannels = new Map();

// All mediasoup workers
let workers: Worker[] = [];
let nextMediasoupWorkerIdx = 0;

declare global {
  namespace Express {
    interface Request extends LooseAuthProp {}
  }
}

declare module "socket.io" {
  interface Socket {
    profile?: Profile;
    voiceChannelId?: string;
  }
}

const MESSAGE_BATCH = 12;

app.use(cors({}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../", "public")));

app.use(
  ClerkExpressWithAuth({
    onError: () => {
      console.log("auth error");
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
    try {
      if (!req.auth.userId) {
        return res.status(401).send("Unauthorized");
      }

      const profile = await currentProfile(req.auth.userId);

      if (!profile) {
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

      io?.emit(channelKey, message);

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

    io?.emit(updateKey, message);

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

    io?.emit(updateKey, message);

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

async function createWorkers() {
  const { numWorkers } = config.mediasoup;

  const { logLevel, logTags, rtcMinPort, rtcMaxPort } = config.mediasoup.worker;

  console.debug("WORKERS:", numWorkers);

  for (let i = 0; i < numWorkers; i++) {
    let worker = await mediasoup.createWorker({
      logLevel: logLevel,
      logTags: logTags,
      rtcMinPort: rtcMinPort,
      rtcMaxPort: rtcMaxPort,
    });

    worker.on("died", () => {
      console.error(
        "Mediasoup worker died, exiting in 2 seconds... [pid:%d]",
        worker.pid
      );
      setTimeout(() => process.exit(1), 2000);
    });

    workers.push(worker);
  }
}

(async () => {
  try {
    await createWorkers();
  } catch (err) {
    console.error("Create Worker ERR --->", err);
  }
})();

async function getMediasoupWorker() {
  const worker = workers[nextMediasoupWorkerIdx];
  if (++nextMediasoupWorkerIdx === workers.length) nextMediasoupWorkerIdx = 0;
  return worker;
}

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    if (VoiceChannels.has(socket.voiceChannelId)) {
      const voiceChannel = VoiceChannels.get(socket.voiceChannelId);

      voiceChannel.removePeer(socket.id);
    }
  });

  socket.on("@auth-token", async (data, cb) => {
    try {
      const { token } = data;

      if (!token) return;

      const { payload } = decodeJwt(token);

      if (!payload) return;

      const profile = await prisma?.profile.findFirstOrThrow({
        where: {
          userId: payload.sub,
        },
      });

      socket.profile = profile;

      cb({
        message: "success",
      });
    } catch (e: any) {
      console.log("Error while getting user profile");
      console.log(e);
      cb({
        error: e.message ?? "Internal error",
      });
    }
  });

  console.log("Connected", socket.id);

  socket.on("join", async (data, cb) => {
    if (!socket.profile)
      return cb({
        error: "unauthorized",
      });

    const { channelId } = data;

    let voiceChannel: VoiceChannel | null = null;

    if (VoiceChannels.has(channelId)) {
      voiceChannel = VoiceChannels.get(channelId);
    } else {
      const channel = await getVoiceChannel(channelId);

      if (channel) {
        let worker = await getMediasoupWorker();

        voiceChannel = new VoiceChannel(channel, worker, io);

        await voiceChannel.createRouter();

        VoiceChannels.set(channelId, voiceChannel);
      } else {
        cb({ error: "channel-not-found" });
      }
    }

    if (!voiceChannel) {
      cb({ error: "channel-not-found" });
    } else {
      socket.voiceChannelId = channelId;

      // const peer_ip =
      //   socket.handshake.headers["x-forwarded-for"] ||
      //   socket.conn.remoteAddress;

      const peer = new Peer(socket.id, socket.profile);

      voiceChannel.addPeer(peer);

      const rtpCapabilities = voiceChannel.getRtpCapabilities();

      const { params } = await voiceChannel.createWebRtcTransport(socket.id);

      socket.emit("joined", {
        rtpCapabilities,
        transportOptions: params,
        channelId,
        peers: JSON.stringify([...voiceChannel.getPeers()]),
      });

      voiceChannel.broadCast(socket.id, "new-peer", { peer });
    }
  });

  // socket.on("@create-webrtc-transport", async (_, cb) => {
  //   if (!VoiceChannels.has(socket.voiceChannelId)) {
  //     cb({
  //       error: "channel-not-found",
  //     });
  //   }

  //   const channel = VoiceChannels.get(socket.voiceChannelId);

  //   try {
  //     const { params } = await channel.createWebRtcTransport(socket.id);

  //     cb({ params });
  //   } catch (e: any) {
  //     console.error("Create WebRtc Transport error: ", e.message);
  //     cb({
  //       error: e.message,
  //     });
  //   }
  // });

  socket.on(
    "@connect-transport",
    async (
      {
        transport_id,
        dtlsParameters,
      }: {
        transport_id: string;
        dtlsParameters: DtlsParameters;
      },
      cb
    ) => {
      if (!VoiceChannels.has(socket.voiceChannelId)) {
        cb({
          error: "channel-not-found",
        });
      }

      const channel = VoiceChannels.get(socket.voiceChannelId);

      try {
        await channel.connectPeerTransport(
          socket.id,
          transport_id,
          dtlsParameters
        );

        cb("success");
      } catch (e: any) {
        console.error("Create WebRtc Transport error: ", e.message);
        cb({
          error: e.message,
        });
      }
    }
  );

  socket.on(
    "@produce",
    async (
      {
        producerTransportId,
        kind,
        rtpParameters,
        appData,
      }: {
        producerTransportId: string;
        kind: MediaKind;
        rtpParameters: RtpParameters;
        appData: AppData;
      },
      cb
    ) => {
      if (!VoiceChannels.has(socket.voiceChannelId)) {
        cb({
          error: "channel-not-found",
        });
      }

      const channel = VoiceChannels.get(socket.voiceChannelId);

      try {
        console.log("loading");

        let producer_id = await channel.produce(
          socket.id,
          producerTransportId,
          rtpParameters,
          kind,
          appData.mediaType
        );

        console.log(producer_id);

        cb({
          id: producer_id,
        });
      } catch (e) {
        console.log(e);
      }
    }
  );

  socket.on(
    "consume",
    async ({ consumerTransportId, producerId, rtpCapabilities }, cb) => {
      if (!VoiceChannels.has(socket.voiceChannelId)) {
        cb({
          error: "channel-not-found",
        });
      }

      const channel = VoiceChannels.get(socket.voiceChannelId);

      let params = await channel.consume(
        socket.id,
        consumerTransportId,
        producerId,
        rtpCapabilities
      );

      cb({
        peerId: socket.id,
        params,
      });
    }
  );

  socket.on("@get-producers", () => {
    if (!VoiceChannels.has(socket.voiceChannelId)) return;

    const channel = VoiceChannels.get(socket.voiceChannelId);

    socket.emit("@new-producers", channel.getProducerListForPeer());
  });
});
