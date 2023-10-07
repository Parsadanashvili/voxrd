"use client";

import { Channel, Profile, Member as MemberBase } from "@prisma/client";
import VoiceMember from "./VoiceMember";
import { Button } from "../ui/button";
import { MicIcon } from "lucide-react";
import { useSocket } from "../providers/SocketProvider";
import { useWebRtc } from "../webrtc/WebRtcProvider";

type Member = MemberBase & {
  profile: Profile;
};

interface VoiceProps {
  channel: Channel;
  member: Member;
}

const Voice = ({ member, channel }: VoiceProps) => {
  const { peers, channelId, joinVoice } = useWebRtc();

  const isJoined = channel.id === channelId;

  return (
    <div className="flex-1 py-[10px]">
      <div className="relative flex justify-center items-center bg-black rounded-[10px] h-full  px-12">
        {isJoined ? (
          <>
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
          </>
        ) : (
          <Button variant="secondary" onClick={() => joinVoice(channel.id)}>
            Join voice
          </Button>
        )}
      </div>
    </div>
  );
};

export default Voice;
