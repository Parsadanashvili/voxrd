"use client";

import { Channel, Profile, Member as MemberBase } from "@prisma/client";
import VoiceMember from "./VoiceMember";
import { Button } from "../ui/button";
import { MicIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../providers/SocketProvider";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import {
  Consumer,
  DtlsParameters,
  IceCandidate,
  IceParameters,
  Producer,
  Transport,
  Device as DeviceType,
} from "mediasoup-client/lib/types";

type Member = MemberBase & {
  profile: Profile;
};

interface VoiceProps {
  channel: Channel;
  member: Member;
}

interface Peer {
  id: string;
  profile: Profile;
}

const Voice = ({ member, channel }: VoiceProps) => {
  const { socket, isConnected } = useSocket();

  const [peers, setPeers] = useState<Peer[]>([]);
  const localStreamRef = useRef<MediaStream>();
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const deviceRef = useRef<DeviceType>(new Device());
  const producerTransportRef = useRef<Transport>();
  const consumerTransportRef = useRef<Transport>();
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const consumersRef = useRef<Map<string, Consumer>>(new Map());

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

  const loadDevice = async (rtpCapabilities: RtpCapabilities) => {
    try {
      await deviceRef.current.load({
        routerRtpCapabilities: rtpCapabilities,
      });

      initProducerTransport();
    } catch (e: unknown) {
      console.error("Browser not supported: ", e);
    }
  };

  const startLocalMedia = async () => {
    console.log(
      localStreamRef.current?.getAudioTracks()[0],
      producerTransportRef.current
    );

    const params = {
      track: localStreamRef.current?.getAudioTracks()[0],
    };

    try {
      const producer = await producerTransportRef.current?.produce(params);

      if (!producer) {
        return console.log("Error while producing audio");
      }

      producersRef.current.set(producer.id, producer);

      producer.on("trackended", () => {});

      producer.on("transportclose", () => {
        producersRef.current.delete(producer.id);
      });

      producer.on("@close", () => {
        producersRef.current.delete(producer.id);
      });

      socket.emit("@get-producers");
    } catch (e) {
      console.log(e);
    }
  };

  const initProducerTransport = () => {
    socket.emit(
      "@create-webrtc-transport",
      {
        rtpCapabilities: deviceRef.current.rtpCapabilities,
      },
      (data: {
        params: {
          id: string;
          iceParameters: IceParameters;
          iceCandidates: IceCandidate[];
          dtlsParameters: DtlsParameters;
        };
      }) => {
        producerTransportRef.current = deviceRef.current.createSendTransport(
          data.params
        );

        producerTransportRef.current.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            socket.emit(
              "@connect-transport",
              {
                dtlsParameters,
                transport_id: data.params.id,
              },
              (data: { error?: string }) => {
                if (data.error) return errback(new Error(data.error));

                callback();
              }
            );
          }
        );

        producerTransportRef.current.on(
          "produce",
          async ({ kind, appData, rtpParameters }, callback, errback) => {
            try {
              socket.emit(
                "@produce",
                {
                  producerTransportId: producerTransportRef.current?.id,
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

        producerTransportRef.current.on(
          "connectionstatechange",
          async (state) => {
            switch (state) {
              case "connecting":
                console.log("Producer Transport connecting...");
                break;

              case "connected":
                console.log("Producer Transport connected");
                break;

              case "failed":
                console.warn("Producer Transport failed");
                producerTransportRef.current?.close();
                break;

              default:
                break;
            }
          }
        );

        producerTransportRef.current.on(
          "icegatheringstatechange",
          async (state) => {
            console.log("Producer icegatheringstatechange", state);
          }
        );

        startLocalMedia();
        initConsumerTransport();
      }
    );
  };

  const initConsumerTransport = () => {
    {
      socket.emit(
        "@create-webrtc-transport",
        {
          rtpCapabilities: deviceRef.current.rtpCapabilities,
        },
        (data: {
          params: {
            id: string;
            iceParameters: IceParameters;
            iceCandidates: IceCandidate[];
            dtlsParameters: DtlsParameters;
          };
        }) => {
          consumerTransportRef.current = deviceRef.current.createRecvTransport(
            data.params
          );

          consumerTransportRef.current.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              socket.emit(
                "@connect-transport",
                {
                  dtlsParameters,
                  transport_id: consumerTransportRef.current?.id,
                },
                (data: { error?: string }) => {
                  if (data.error) return errback(new Error(data.error));

                  callback();
                }
              );
            }
          );

          consumerTransportRef.current.on(
            "connectionstatechange",
            async (state) => {
              switch (state) {
                case "connecting":
                  console.log("Consumer Transport connecting...");
                  break;

                case "connected":
                  console.log("Consumer Transport connected");
                  break;

                case "failed":
                  console.warn("Consumer Transport failed");
                  consumerTransportRef.current?.close();
                  break;

                default:
                  break;
              }
            }
          );

          consumerTransportRef.current.on(
            "icegatheringstatechange",
            async (state) => {
              console.log("Consumer icegatheringstatechange", state);
            }
          );
        }
      );
    }
  };

  const join = () => {
    socket.emit(
      "join",
      {
        channel_id: channel.id,
      },
      async (data: any) => {
        const { rtpCapabilities, peers } = data;

        const peersMap = new Map<string, Peer>(JSON.parse(peers));
        const peersArray = Array.from(peersMap, ([key, value]) => value);

        await loadDevice(rtpCapabilities);
        setPeers(peersArray);

        sound("joined");
      }
    );
  };

  const initChannel = async () => {
    await getLocalStream();
    join();
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

  useEffect(() => {
    if (isConnected && socket) {
      initChannel();
    }
  }, [isConnected, socket]);

  useEffect(() => {
    if (isConnected && socket) {
      socket.on("new-peer", (data: any) => {
        setPeers((old) => [...old, data.peer]);

        sound("joined");
      });

      socket.on("remove-peer", (data: any) => {
        setPeers((old) => old.filter((i) => i.id !== data?.id));
      });

      socket.on("@new-producers", (data: any) => {
        if (data.length > 0) {
          for (let producer_id of data) {
            const { rtpCapabilities } = deviceRef.current;

            socket.emit(
              "consume",
              {
                rtpCapabilities,
                consumerTransportId: consumerTransportRef.current?.id,
                producer_id,
              },
              async (data: any) => {
                const { id, kind, rtpParameters } = data;

                const consumer = await consumerTransportRef.current?.consume({
                  id,
                  producerId: producer_id,
                  kind,
                  rtpParameters,
                });

                if (!consumer) {
                  console.log("No consumer");
                  return;
                }

                const stream = new MediaStream();
                stream.addTrack(consumer.track);

                console.log("consume audio");

                const audio = new Audio();
                audio.srcObject = stream;
                audio.volume = 1;
                await audio.play();

                remoteAudiosRef.current.set(consumer.id, audio);

                consumersRef.current.set(consumer.id, consumer);

                const removeConsumer = () => {
                  const audio = remoteAudiosRef.current.get(consumer.id);

                  if (audio) {
                    (audio.srcObject as MediaStream)
                      ?.getTracks()
                      .forEach((track) => {
                        track?.stop();
                      });

                    remoteAudiosRef.current.delete(consumer.id);
                  }
                };

                consumer.on("trackended", () => {
                  removeConsumer();
                });

                consumer.on("transportclose", () => {
                  removeConsumer();
                });
              }
            );
          }
        }
      });
    }

    return () => {
      if (isConnected && socket) {
        socket.off("new-peer");
        socket.off("remove-peer");
      }
    };
  }, [isConnected, socket]);

  return (
    <div className="flex-1 py-[10px]">
      <div className="relative flex justify-center items-center bg-black rounded-[10px] h-full  px-12">
        <div className="flex flex-wrap justify-center gap-[12px]">
          {peers.map((peer) => {
            return <VoiceMember key={peer.id} profile={peer.profile} />;
          })}
        </div>

        <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2">
          <Button>
            <MicIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Voice;
