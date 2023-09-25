"use client";

import { Server } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";

type DiscoverItemProps = Server & { _count: { members: number } };

const DiscoverItem = ({
  id,
  name,
  imageUrl,
  inviteCode,
  _count: { members },
}: DiscoverItemProps) => {
  const router = useRouter();

  const onClick = () => {
    router.push(`/invite/${inviteCode}`);
  };

  return (
    <div
      className="bg-card rounded-lg overflow-hidden select-none cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-[140px] w-full">
        <div className="absolute top-0 left-0 right-0 bottom-0"></div>
        <Image
          width={400}
          height={150}
          src={imageUrl}
          alt="server-image"
          className="rounded-b-lg w-full h-full object-cover"
        />
      </div>
      <div className="pt-[25px] px-5 pb-5 flex flex-col">
        <div className="font-bold text-sm">{name}</div>
        <p className="text-xs mt-[10px]">
          A space for developers and enthusiasts to collaborate and share
          creations built with OpenAIs powerful models.
        </p>
        <div className="flex items-center gap-6 mt-4 sm:mt-8">
          <div className="flex items-center text-white text-sm">
            <div className="bg-[#A58E8E] w-3 h-3 rounded-full mr-1" />
            {members} Members
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverItem;
