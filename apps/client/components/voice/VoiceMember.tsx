"use client";

import { Profile } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useEffect, useRef } from "react";

interface VoiceMemberProps {
  profile: Profile;
  videoStream?: MediaStream;
}

const VoiceMember = ({ profile, videoStream }: VoiceMemberProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !videoStream) return;

    videoRef.current.srcObject = videoStream;

    if (videoRef.current.paused) {
      videoRef.current.play();
    }
  }, [videoStream]);

  return (
    <div className="relative flex items-center justify-center bg-card w-96 h-56 rounded-lg group select-none overflow-hidden">
      {videoStream ? (
        <div className="w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <Avatar className="w-[50px] h-[50px]">
          <AvatarImage src={profile.imageUrl} />
          <AvatarFallback>
            {profile.username.charAt(0).toLocaleUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="absolute left-[10px] bottom-[10px] bg-black/50 p-[4px] rounded-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
        {profile.username}
      </div>
    </div>
  );
};

export default VoiceMember;
