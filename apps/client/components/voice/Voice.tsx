"use client";

import { Channel, Profile, Member as MemberBase } from "@prisma/client";
import VoiceMember from "./VoiceMember";
import { Button } from "../ui/button";
import { Mic, PhoneMissed, ScreenShare, Video } from "lucide-react";
import { useWebRtc } from "../webrtc/WebRtcProvider";

type Member = MemberBase & {
  profile: Profile;
};

interface VoiceProps {
  channel: Channel;
  member: Member;
}

const Voice = ({ channel }: VoiceProps) => {
  const { peers, channelId, joinVoice, leaveVoice } = useWebRtc();

  const isJoined = channel.id === channelId;

  return (
    <div className="flex-1 py-[10px]">
      <div className="relative flex justify-center items-center bg-black/10 dark:bg-black rounded-[10px] h-full  px-12">
        {isJoined ? (
          <>
            <div className="flex flex-wrap justify-center gap-[12px]">
              {peers.map((peer) => {
                return <VoiceMember key={peer.id} profile={peer.profile} />;
              })}
            </div>

            <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-3">
                <Button variant={"secondary"} size={"icon"}>
                  <Video />
                </Button>

                <Button variant={"secondary"} size={"icon"}>
                  <ScreenShare />
                </Button>

                <Button variant={"secondary"} size={"icon"}>
                  <Mic />
                </Button>

                <Button
                  onClick={() => leaveVoice()}
                  variant={"destructive"}
                  size={"icon"}
                >
                  <PhoneMissed />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-y-4">
            <div className="text-3xl font-semibold text-foreground">
              #{channel.name}
            </div>

            {/* {peers.length > 0 ? (
              <div className="text-base font-medium">
                {peers
                  .filter((_, i) => i < 5)
                  .map((i) => i.profile.username)
                  .join(", ")}{" "}
                is in voice
              </div>
            ) : (
              <div className="text-base font-medium text-muted-foreground">
                No one is currently in voice
              </div>
            )} */}

            <Button variant="secondary" onClick={() => joinVoice(channel.id)}>
              Join voice
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Voice;
