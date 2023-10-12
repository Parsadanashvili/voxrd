"use client";

import { Channel, Profile, Member as MemberBase } from "@prisma/client";
import VoiceMember from "./VoiceMember";
import { Button } from "../ui/button";
import { Mic, MicOff, PhoneMissed, ScreenShare, Video } from "lucide-react";
import { useWebRtc } from "../webrtc/WebRtcProvider";
import { useUserSettings } from "../providers/UserSettingsProvider";

type Member = MemberBase & {
  profile: Profile;
};

interface VoiceProps {
  channel: Channel;
  member: Member;
}

const Voice = ({ channel }: VoiceProps) => {
  const { peers, channelId, joinVoice, leaveVoice } = useWebRtc();

  const { micMuted, setMicMuted, cameraOff, setCameraOff } = useUserSettings();

  const isJoined = channel.id === channelId;

  return (
    <div className="flex-1 py-[10px]">
      <div className="relative flex justify-center items-center bg-black rounded-[10px] h-full  px-12">
        {isJoined ? (
          <>
            <div className="flex flex-wrap justify-center gap-[12px]">
              {peers.map((peer) => {
                return (
                  <VoiceMember
                    key={peer.id}
                    profile={peer.profile}
                    videoStream={peer.videoStream}
                  />
                );
              })}
            </div>

            <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-3">
                <Button
                  className={
                    !cameraOff
                      ? "bg-white hover:bg-neutral-400 text-black hover:text-black"
                      : ""
                  }
                  variant={"secondary"}
                  size={"icon"}
                  onClick={() => setCameraOff((i) => !i)}
                >
                  <Video />
                </Button>

                <Button variant={"secondary"} size={"icon"}>
                  <ScreenShare />
                </Button>

                <Button
                  className={
                    micMuted
                      ? "bg-white hover:bg-neutral-400 text-black hover:text-black"
                      : ""
                  }
                  variant={"secondary"}
                  size={"icon"}
                  onClick={() => setMicMuted((i) => !i)}
                >
                  {micMuted ? <MicOff /> : <Mic />}
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
