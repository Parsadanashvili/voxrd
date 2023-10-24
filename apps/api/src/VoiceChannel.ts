import { Worker } from "mediasoup/node/lib/Worker";
import { Server as IOServer } from "socket.io";
import Peer from "./Peer";
import { Channel } from "@prisma/client";
import config from "./config";
import {
  DtlsParameters,
  MediaKind,
  Router,
  RtpCapabilities,
  RtpParameters,
} from "mediasoup/node/lib/types";

export default class VoiceChannel {
  declare channel: Channel;
  declare peers: Map<string, Peer>;
  declare worker: Worker;
  declare io: IOServer;
  declare router: Router | null;

  constructor(channel: Channel, worker: Worker, io: IOServer) {
    this.channel = channel;
    this.peers = new Map();
    this.worker = worker;
    this.router = null;
    this.io = io;
  }

  async createRouter() {
    const { mediaCodecs } = config.mediasoup.router;

    try {
      const router = await this.worker.createRouter({
        mediaCodecs,
      });

      this.router = router;
    } catch (e) {
      console.error("Create Router ERR --->", e);
    }
  }

  getRtpCapabilities() {
    return this.router?.rtpCapabilities;
  }

  // WEBRTC

  async createWebRtcTransport(socket_id: string) {
    if (!this.router)
      return {
        params: null,
      };

    const { maxIncomingBitrate, initialAvailableOutgoingBitrate, listenIps } =
      config.mediasoup.webRtcTransport;

    const transport = await this.router.createWebRtcTransport({
      listenIps: listenIps as any,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });

    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) {}
    }

    transport.on("dtlsstatechange", (dtlsState) => {
      console.log("state", dtlsState);

      if (dtlsState === "failed") {
        transport.close();
      }

      if (dtlsState === "closed") {
        transport.close();
      }
    });

    this.peers.get(socket_id)?.addTransport(transport);

    return {
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }

  // PRODUCE

  async produce(
    socket_id: string,
    producerTransportId: string,
    rtpParameters: RtpParameters,
    kind: MediaKind,
    type: string
  ) {
    return new Promise(async (resolve, reject) => {
      let producer = await this.peers
        .get(socket_id)
        ?.createProducer(producerTransportId, rtpParameters, kind, type);

      if (!producer) {
        return reject("No producer");
      }

      resolve(producer.id);

      this.broadCast(socket_id, "@new-producers", [
        {
          producerId: producer.id,
          peerId: socket_id,
        },
      ]);
    });
  }

  // CONSUME

  async consume(
    socket_id: string,
    consumer_transport_id: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities
  ) {
    if (!this.router) return;

    if (
      !this.router.canConsume({
        producerId: producerId,
        rtpCapabilities,
      })
    ) {
      return console.warn("Can not consume", {
        socket_id: socket_id,
        consumer_transport_id: consumer_transport_id,
        producerId,
      });
    }

    let data = await this.peers
      .get(socket_id)
      ?.createConsumer(consumer_transport_id, producerId, rtpCapabilities);

    if (!data) return;

    let { consumer, params } = data;

    consumer.on("producerclose", () => {
      this.peers.get(socket_id)?.removeConsumer(consumer.id);

      // tell client consumer is dead
      this.io?.to(socket_id).emit("@consumer-closed", {
        consumerId: consumer.id,
        consumerKind: consumer.kind,
      });
    });

    return params;
  }

  closeProducer(socketId: string, producerId: string) {
    this.peers.get(socketId)?.closeProducer(producerId);
  }

  // PEERS

  async connectPeerTransport(
    socket_id: string,
    transport_id: string,
    dtlsParameters: DtlsParameters
  ) {
    if (!this.peers.has(socket_id)) return;
    await this.peers
      .get(socket_id)
      ?.connectTransport(transport_id, dtlsParameters);
  }

  getProducerListForPeer(socketId: string) {
    let producerList: {
      producerId: string;
      peerId: string;
    }[] = [];
    this.peers.forEach((peer) => {
      if (peer.id !== socketId) {
        peer.producers.forEach((producer) => {
          producerList.push({
            producerId: producer.id,
            peerId: peer.id,
          });
        });
      }
    });
    return producerList;
  }

  addPeer(peer: Peer) {
    this.peers.set(peer.id, peer);
  }

  async removePeer(socket_id: string) {
    if (!this.peers.has(socket_id)) return;
    this.peers.get(socket_id)?.close();
    this.peers.delete(socket_id);
    this.broadCast(socket_id, "remove-peer", { id: socket_id });
  }

  getPeers() {
    return this.peers;
  }

  getPeersCount() {
    return this.peers.size;
  }

  // COMUNICATION

  broadCast(socket_id: string, action: string, data: any) {
    for (let otherID of Array.from(this.peers.keys()).filter(
      (id) => id !== socket_id
    )) {
      this.send(otherID, action, data);
    }
  }

  send(socket_id: string, action: string, data: any) {
    this.io.to(socket_id).emit(action, data);
  }
}
