"use client";

import {
  Dispatch,
  SetStateAction,
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
import { Socket } from "socket.io-client";
import { useUserMedia } from "../providers/UserMediaProvider";
import { useUserSettings } from "../providers/UserSettingsProvider";

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
  [string, string],
  {
    producer: Producer;
  }
>;

interface Peer {
  id: string;
  profile: Profile;
  videoStream?: MediaStream;
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
  joinVoice: () => {},
  leaveVoice: () => {},
});

export const WebRtcProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    socket,
    isConnected,
  }: {
    socket: Socket | null;
    isConnected: boolean;
  } = useSocket();

  const { microphoneDeviceId, cameraDeviceId, cameraOff, setCameraOff } =
    useUserSettings();
  const { stopActiveCamera, getCamera, stopActiveMicrophone, getMicrophone } =
    useUserMedia();

  const [peers, setPeers] = useState<Peer[]>([]);

  const [channelId, setChannelId] = useState<string>();
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const prodTransportRef = useRef<Transport>();
  const consTransportRef = useRef<Transport>();
  const deviceRef = useRef(getDevice());

  const producersRef = useRef<ProducersMap>(new Map());
  const consumersRef = useRef<ConsumersMap>(new Map());

  const receiveVoice = () => {
    if (!socket) return;

    socket.emit("@get-producers");
  };

  const consumeAudio = (producerId: string, producerPeerId: string) => {
    const rtpCapabilities = deviceRef.current?.rtpCapabilities;

    if (!socket) return;

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
          },
        });

        if (!consumer) {
          console.log("No consumer");
          return;
        }

        const stream = new MediaStream();
        stream.addTrack(consumer.track);

        let volume = 100;

        if (consumersRef.current.has(consumer.id)) {
          const x = consumersRef.current.get(consumer.id);
          volume = x?.volume ?? 100;
          x?.consumer.close();
        }

        if (consumer.track.kind === "audio") {
          const audio = new Audio();
          audio.srcObject = stream;
          audio.volume = 1;

          try {
            await audio.play();
          } catch (e) {
            console.log(e);
          }

          remoteAudiosRef.current.set(consumer.id, audio);
        } else if (consumer.kind === "video") {
          setPeers((prev) => {
            const n = prev
              .filter((i) => {
                if (i.id === producerPeerId) {
                  i.videoStream = stream;
                }

                return i;
              })
              .map((i) => i);

            return n;
          });
        }

        const handleClose = () => {
          if (consumer.track.kind === "audio") {
          } else if (consumer.kind === "video") {
            consumer.track.stop();
            consumersRef.current.delete(consumer.id);
            consumer?.close();

            if (socket) {
              setPeers((prev) => {
                const n = prev
                  .filter((i) => {
                    if (i.id == producerPeerId) {
                      i.videoStream = undefined;
                    }

                    return i;
                  })
                  .map((i) => i);

                return n;
              });
            }
          }
        };

        consumer.on("trackended", () => {
          handleClose();
        });

        consumer.on("transportclose", () => {
          handleClose();
        });

        consumer.on("@close", () => {
          handleClose();
        });

        consumersRef.current.set(consumer.id, {
          consumer,
          volume,
        });
      }
    );
  };

  const removeConsumer = (consumerId: string, consumerKind: string) => {
    if (!consumersRef.current.has(consumerId)) return;

    consumersRef.current.get(consumerId)?.consumer.close();
  };

  const sendVideo = async () => {
    stopActiveCamera();

    const track = await getCamera(cameraDeviceId);

    const producer = await prodTransportRef.current?.produce({
      encodings: [
        {
          rid: "r0",
          maxBitrate: 100000,
          scalabilityMode: "S1T3",
        },
        {
          rid: "r1",
          maxBitrate: 300000,
          scalabilityMode: "S1T3",
        },
        {
          rid: "r2",
          maxBitrate: 900000,
          scalabilityMode: "S1T3",
        },
      ],
      codecOptions: {
        videoGoogleStartBitrate: 1000,
      },
      track,
      appData: { mediaTag: "video" },
    });

    if (!producer) {
      return console.log("Error while producing video");
    }

    producersRef.current.set([producer.id, "video"], { producer });

    const stream = new MediaStream();
    stream.addTrack(track);

    if (socket) {
      setPeers((prev) => {
        const n = prev
          .filter((i) => {
            if (i.id === socket.id) {
              i.videoStream = stream;
            }

            return i;
          })
          .map((i) => i);

        return n;
      });
    }

    const handleClose = () => {
      track.stop();
      producer.close();
      producersRef.current?.delete([producer?.id, "video"]);

      socket?.emit("@producer-closed", {
        producerId: producer.id,
      });

      if (socket) {
        setPeers((prev) => {
          const n = prev
            .filter((i) => {
              if (i.id === socket.id) {
                i.videoStream = undefined;
              }

              return i;
            })
            .map((i) => i);

          return n;
        });
      }
    };

    producer.on("transportclose", () => {
      handleClose();
    });

    producer.on("@close", () => {
      handleClose();
    });
  };

  const sendVoice = async () => {
    stopActiveMicrophone();

    const track = await getMicrophone(microphoneDeviceId);

    const producer = await prodTransportRef.current?.produce({
      track,
      appData: { mediaTag: "mic" },
    });

    if (!producer) {
      return console.log("Error while producing audio");
    }

    producersRef.current.set([producer?.id, "audio"], {
      producer,
    });

    producer.on("transportclose", () => {
      track.stop();
      producersRef.current.delete([producer?.id, "audio"]);

      socket?.emit("@producer-closed", {
        producerId: producer.id,
      });
    });

    producer.on("@close", () => {
      track.stop();
      producersRef.current.delete([producer?.id, "audio"]);

      socket?.emit("@producer-closed", {
        producerId: producer.id,
      });
    });
  };

  const createTransport = async (
    direction: "recv" | "send",
    transportOptions: TransportOptions
  ) => {
    if (!socket) return;

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
              ({ id }: { id: string }) => {
                callback({
                  id,
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
            if (error === "already-in-voice") {
              alert("You are already in voice channel!");
            }
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
      setPeers((old) => {
        if (!old.find((i) => i.id === data.id)) {
          return [...old, data.peer];
        }

        return old;
      });

      sound("joined");
    });

    socket.on("remove-peer", (data: any) => {
      setPeers((old) => old.filter((i) => i.id !== data?.id));
    });

    socket.on("@new-producers", (data: any) => {
      if (data.length > 0) {
        for (let { producerId, peerId } of data) {
          consumeAudio(producerId, peerId);
        }
      }
    });

    socket.on("@consumer-closed", (data: any) => {
      removeConsumer(data.consumerId, data.consumerKind);
    });

    return () => {
      socket.off("joined");
      socket.off("new-peer");
      socket.off("remove-peer");
      socket.off("@new-producers");
    };
  }, [isConnected, socket]);

  useEffect(() => {
    if (!cameraOff) {
      sendVideo();
    } else {
      producersRef.current.forEach((value, key) => {
        if (key[1] === "video") {
          stopActiveCamera();
          value.producer.close();
        }
      });
    }
  }, [cameraOff]);

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
