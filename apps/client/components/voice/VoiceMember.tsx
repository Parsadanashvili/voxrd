"use client";

import { Profile } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface VoiceMemberProps {
  profile: Profile;
}

const VoiceMember = ({ profile }: VoiceMemberProps) => {
  return (
    <div className="relative flex items-center justify-center bg-card w-96 h-56 rounded-lg group select-none">
      <Avatar className="w-[50px] h-[50px]">
        <AvatarImage src={profile.imageUrl} />
        <AvatarFallback>
          {profile.username.charAt(0).toLocaleUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="absolute left-[10px] bottom-[10px] bg-black/50 p-[4px] rounded-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
        {profile.username}
      </div>
    </div>
  );
};

export default VoiceMember;
