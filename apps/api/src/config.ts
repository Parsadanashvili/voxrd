"use strict";

import {
  RtpCodecCapability,
  WorkerLogLevel,
  WorkerLogTag,
} from "mediasoup/node/lib/types";
import os from "os";

function getListenIps() {
  const listenIps = [];
  if (typeof window === "undefined") {
    const networkInterfaces = os.networkInterfaces();
    const ips = [];
    if (networkInterfaces) {
      for (const [key, addresses] of Object.entries(networkInterfaces)) {
        addresses?.forEach((address) => {
          if (address.family === "IPv4") {
            listenIps.push({
              ip: address.address,
              announcedIp: process.env.A_IP ?? null,
            });
          } else if (address.family === "IPv6" && address.address[0] !== "f") {
            listenIps.push({
              ip: address.address,
              announcedIp: null,
            });
          }
        });
      }
    }
  }
  if (listenIps.length === 0) {
    listenIps.push({ ip: "127.0.0.1", announcedIp: null });
  }

  return listenIps;
}

export default {
  port: process.env.PORT || 8000,
  jwt: {
    secret: (process.env.JWT_SECRET ?? "secret_voxrd") as string,
    expiresIn: 60 * 60 * 24 * 30,
  },
  mediasoup: {
    numWorkers: Object.keys(os.cpus()).length,
    worker: {
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
      logLevel: "error" as WorkerLogLevel,
      logTags: [
        "info",
        "ice",
        "dtls",
        "rtp",
        "srtp",
        "rtcp",
        "rtx",
        "bwe",
        "score",
        "simulcast",
        "svc",
        "sctp",
      ] as WorkerLogTag[],
    },
    router: {
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/VP9",
          clockRate: 90000,
          parameters: {
            "profile-id": 2,
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/h264",
          clockRate: 90000,
          parameters: {
            "packetization-mode": 1,
            "profile-level-id": "4d0032",
            "level-asymmetry-allowed": 1,
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/h264",
          clockRate: 90000,
          parameters: {
            "packetization-mode": 1,
            "profile-level-id": "42e01f",
            "level-asymmetry-allowed": 1,
            "x-google-start-bitrate": 1000,
          },
        },
      ] as RtpCodecCapability[],
    },

    webRtcTransport: {
      listenIps: getListenIps(),
      initialAvailableOutgoingBitrate: 1000000,
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,
      maxIncomingBitrate: 1500000,
    },
  },
};
