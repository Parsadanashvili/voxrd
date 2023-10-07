import { Profile } from "@prisma/client";
import { DtlsParameters } from "mediasoup/node/lib/WebRtcTransport";
import {
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

  constructor(socket_id: string, profile: Profile) {
    this.id = socket_id;
    this.profile = profile;
    this.transports = new Map();
    this.consumers = new Map();
    this.producers = new Map();
  }

  // ------ Transport ------

  addTransport(transport: WebRtcTransport) {
    this.transports.set(transport.id, transport);
  }

  async connectTransport(transport_id: string, dtlsParameters: DtlsParameters) {
    if (!this.transports.has(transport_id)) return;

    await this.transports.get(transport_id)?.connect({
      dtlsParameters: dtlsParameters,
    });
  }

  close() {
    this.transports.forEach((transport) => transport.close());
  }

  // ------ Producer ------

  getProducer(producer_id: string) {
    return this.producers.get(producer_id);
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

      producer.close();
      this.producers.delete(producer.id);
    });

    return producer;
  }

  closeProducer(producer_id: string) {
    if (!this.producers.has(producer_id)) return;
    try {
      this.producers.get(producer_id)?.close();
    } catch (ex) {
      console.warn("Close Producer", ex);
    }
    this.producers.delete(producer_id);
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
        producerId: producerId,
        rtpCapabilities,
        enableRtx: true, // Enable NACK for OPUS.
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

  removeConsumer(consumer_id: string) {
    if (this.consumers.has(consumer_id)) {
      this.consumers.delete(consumer_id);
    }
  }
}
