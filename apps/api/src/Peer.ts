import type { Profile } from "@prisma/client";
import type { DtlsParameters } from "mediasoup/node/lib/WebRtcTransport";
import type {
  Consumer,
  MediaKind,
  Producer,
  RtpCapabilities,
  RtpParameters,
  WebRtcTransport,
} from "mediasoup/node/lib/types";

export default class Peer {
  declare id: string;
  declare profile: Profile;
  declare transports: Map<string, WebRtcTransport>;
  declare consumers: Map<string, Consumer>;
  declare producers: Map<string, Producer>;

  constructor(socketId: string, profile: Profile) {
    this.id = socketId;
    this.profile = profile;
    this.transports = new Map();
    this.consumers = new Map();
    this.producers = new Map();
  }

  // ------ Transport ------

  addTransport(transport: WebRtcTransport) {
    this.transports.set(transport.id, transport);
  }

  async connectTransport(transportId: string, dtlsParameters: DtlsParameters) {
    if (!this.transports.has(transportId)) return;

    await this.transports.get(transportId)?.connect({
      dtlsParameters: dtlsParameters,
    });
  }

  close() {
    this.transports.forEach((transport) => transport.close());
  }

  // ------ Producer ------

  getProducer(producerId: string) {
    return this.producers.get(producerId);
  }

  async createProducer(
    producerTransportId: string,
    rtpParameters: RtpParameters,
    kind: MediaKind,
    type: string
  ) {
    let producer = await this.transports.get(producerTransportId)?.produce({
      kind,
      rtpParameters,
    });

    if (!producer) {
      throw "No producer";
    }

    producer.appData.mediaType = type;
    this.producers.set(producer.id, producer);

    producer.on("transportclose", () => {
      if (!producer) return;

      this.closeProducer(producer.id);
    });

    return producer;
  }

  closeProducer(producerId: string) {
    if (!this.producers.has(producerId)) return;
    try {
      this.producers.get(producerId)?.close();
    } catch (ex) {
      console.warn("Close Producer", ex);
    }
    this.producers.delete(producerId);
  }

  // ------ Consumer ------

  async createConsumer(
    consumerTransportId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities
  ) {
    let consumerTransport = this.transports.get(consumerTransportId);

    if (!consumerTransport) return;

    let consumer: Consumer | null = null;

    try {
      consumer = await consumerTransport.consume({
        producerId,
        rtpCapabilities,
        enableRtx: true,
        paused: false,
      });
    } catch (error) {
      return console.error("Consume failed", error);
    }

    this.consumers.set(consumer.id, consumer);

    consumer.on("transportclose", () => {
      if (!consumer) return;

      this.removeConsumer(consumer.id);
    });

    return {
      consumer,
      params: {
        producerId: producerId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      },
    };
  }

  removeConsumer(consumerId: string) {
    if (this.consumers.has(consumerId)) {
      this.consumers.delete(consumerId);
    }
  }
}
