"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSocket } from "../providers/SocketProvider";
import { Device, detectDevice } from "mediasoup-client";
import {
  Consumer,
  MediaKind,
  Producer,
  RtpCapabilities,
  RtpParameters,
  Transport,
  TransportOptions,
} from "mediasoup-client/lib/types";
import { Profile } from "@prisma/client";

const getDevice = () => {
  try {
    let handlerName = detectDevice();
    if (!handlerName) {
      handlerName = "Chrome74";
    }

    return new Device({ Handler: handlerName });
  } catch {
    return null;
  }
};

type ConsumersMap = Map<
  string,
  {
    consumer: Consumer;
    volume: number;
  }
>;

type ProducersMap = Map<
  string,
  {
    producer: Producer;
  }
>;

interface Peer {
  id: string;
  profile: Profile;
}

interface WebRtcContextValue {
  channelId?: string;
  peers: Peer[];
  joinVoice: (channelId: string) => {} | void;
  leaveVoice: () => {} | void;
}

const WebRtcContext = createContext<WebRtcContextValue>({
  channelId: undefined,
  peers: [],
  joinVoice: (channeId: string) => {},
  leaveVoice: () => {},
});

export const WebRtcProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket, isConnected } = useSocket();

  const [peers, setPeers] = useState<Peer[]>([]);

  const [channelId, setChannelId] = useState<string>();
  const localStreamRef = useRef<MediaStream>();
  const localTrackRef = useRef<MediaStreamTrack>();
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const prodTransportRef = useRef<Transport>();
  const consTransportRef = useRef<Transport>();
  const deviceRef = useRef(getDevice());

  const producersRef = useRef<ProducersMap>(new Map());
  const consumersRef = useRef<ConsumersMap>(new Map());

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      localStreamRef.current = stream;
    } catch (e) {
      console.log(e);
    }
  };

  const receiveVoice = () => {
    socket.emit("@get-producers");
  };

  const consumeAudio = (producerId: string) => {
    const rtpCapabilities = deviceRef.current?.rtpCapabilities;

    socket.emit(
      "@consume",
      {
        rtpCapabilities,
        consumerTransportId: consTransportRef.current?.id,
        producerId,
      },
      async (data: {
        peerId: string;
        params: {
          id: string;
          kind: MediaKind;
          rtpParameters: RtpParameters;
        };
      }) => {
        const {
          peerId,
          params: { id, kind, rtpParameters },
        } = data;

        const consumer = await consTransportRef.current?.consume({
          id,
          producerId,
          kind,
          rtpParameters,
          appData: {
            peerId,
            mediaTag: "audio",
          },
        });

        if (!consumer) {
          console.log("No consumer");
          return;
        }

        const stream = new MediaStream();
        stream.addTrack(consumer.track);

        let volume = 100;
        if (consumersRef.current.has(peerId)) {
          const x = consumersRef.current.get(peerId);
          volume = x?.volume ?? 100;
          x?.consumer.close();
        }

        const audio = new Audio();
        audio.srcObject = stream;
        audio.volume = 1;

        try {
          await audio.play();
        } catch (e) {
          console.log(e);
        }

        remoteAudiosRef.current.set(consumer.id, audio);

        consumersRef.current.set(peerId, {
          consumer,
          volume,
        });
      }
    );
  };

  const sendVoice = async () => {
    localTrackRef.current?.stop();

    await getLocalStream();

    const audioTracks = localStreamRef.current?.getAudioTracks();

    if (audioTracks?.length) {
      const track = audioTracks[0];

      const producer = await prodTransportRef.current?.produce({
        track,
        appData: { mediaTag: "mic" },
      });

      if (!producer) {
        return console.log("Error while producing audio");
      }

      producersRef.current.set(producer?.id, {
        producer,
      });

      producer.on("transportclose", () => {
        producersRef.current.delete(producer.id);
      });

      producer.on("@close", () => {
        producersRef.current.delete(producer.id);
      });

      localTrackRef.current = track;
    }
  };

  const createTransport = async (
    direction: "recv" | "send",
    transportOptions: TransportOptions
  ) => {
    const transport =
      direction === "recv"
        ? await deviceRef.current!.createRecvTransport(transportOptions)
        : await deviceRef.current!.createSendTransport(transportOptions);

    transport.on("connect", ({ dtlsParameters }, callback, errback) => {
      socket.emit(
        `@connect-transport`,
        {
          transportId: transport.id,
          dtlsParameters,
        },
        (data: { error?: string }) => {
          if (data.error) {
            return errback(new Error(data.error));
          }

          callback();
        }
      );
    });

    if (direction === "send") {
      transport.on(
        "produce",
        async ({ kind, appData, rtpParameters }, callback, errback) => {
          try {
            socket.emit(
              "@produce",
              {
                producerTransportId: transport.id,
                kind,
                appData,
                rtpParameters,
              },
              ({ producer_id }: { producer_id: string }) => {
                callback({
                  id: producer_id,
                });
              }
            );
          } catch (e) {
            if (e instanceof Error) {
              errback(e);
            }
          }
        }
      );
    }

    transport.on("icegatheringstatechange", (state) => {
      console.warn(
        `${direction} transport ${transport.id} icegatheringstatechange ${state}`
      );
    });

    transport.on("connectionstatechange", (state) => {
      console.warn(
        `${direction} transport ${transport.id} connectionstatechange ${state}`
      );
    });

    if (direction == "recv") {
      consTransportRef.current = transport;
    } else {
      prodTransportRef.current = transport;
    }
  };

  const handleJoin = async (rtpCapabilities: RtpCapabilities) => {
    if (!deviceRef.current!.loaded) {
      await deviceRef.current?.load({
        routerRtpCapabilities: rtpCapabilities,
      });
    }
  };

  const sound = async (name: string) => {
    let sound = "/sounds/" + name + ".ogg";

    const audio = new Audio(sound);

    try {
      audio.volume = 0.5;
      await audio.play();
    } catch (err) {
      return false;
    }
  };

  const joinVoice = useCallback(
    (channelId: string) => {
      if (!socket) return;
      socket.emit(
        "join",
        {
          channelId,
        },
        ({ error }: { error?: string }) => {
          if (error) {
            console.log("Error - " + error);
          }
        }
      );
    },
    [socket]
  );

  const leaveVoice = useCallback(() => {
    if (!socket) return;

    setChannelId(undefined);
    setPeers([]);

    socket.emit("leave", {}, ({ error }: { error?: string }) => {
      if (error) {
        console.log("Error - " + error);
      }
    });
  }, [socket]);

  useEffect(() => {
    if (!isConnected || !socket) return;

    socket.on(
      "joined",
      async ({
        rtpCapabilities,
        sendTransportOptions,
        recvTransportOptions,
        channelId,
        peers,
      }: {
        rtpCapabilities: RtpCapabilities;
        sendTransportOptions: TransportOptions;
        recvTransportOptions: TransportOptions;
        channelId: string;
        peers: string;
      }) => {
        setChannelId(channelId);

        try {
          await handleJoin(rtpCapabilities);
        } catch (err) {
          console.log("error creating a device | ", err);
          return;
        }

        try {
          await createTransport("send", sendTransportOptions);
        } catch (err) {
          console.log("error creating send transport | ", err);
          return;
        }

        try {
          await sendVoice();
        } catch (err) {
          console.log("error sending voice | ", err);
          return;
        }

        await createTransport("recv", recvTransportOptions);

        receiveVoice();

        const peersMap = new Map<string, Peer>(JSON.parse(peers));
        const peersArray = Array.from(peersMap, ([key, value]) => value);
        setPeers(peersArray);

        sound("joined");
      }
    );

    socket.on("new-peer", (data: any) => {
      setPeers((old) => [...old, data.peer]);

      sound("joined");
    });

    socket.on("remove-peer", (data: any) => {
      setPeers((old) => old.filter((i) => i.id !== data?.id));
    });

    socket.on("@new-producers", (data: any) => {
      if (data.length > 0) {
        for (let producerId of data) {
          consumeAudio(producerId);
        }
      }
    });

    return () => {
      socket.off("joined");
      socket.off("new-peer");
      socket.off("remove-peer");
      socket.off("@new-producers");
    };
  }, [isConnected, socket]);

  const value = useMemo(
    () => ({
      channelId,
      peers,
      joinVoice,
      leaveVoice,
    }),
    [channelId, peers, joinVoice, leaveVoice]
  );

  return (
    <WebRtcContext.Provider value={value}>{children}</WebRtcContext.Provider>
  );
};

export const useWebRtc = () => {
  const context = useContext(WebRtcContext);

  return context;
};
