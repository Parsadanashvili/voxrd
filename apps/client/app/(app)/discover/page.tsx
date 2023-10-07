import MobileToggle from "@/components/MobileToggle";
import DiscoverItem from "@/components/discover/DiscoverItem";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { Server } from "@prisma/client";
import { Search } from "lucide-react";
import Image from "next/image";
import React from "react";

const DiscoverPage = async () => {
  const servers = await db.server.findMany({
    take: 10,
    orderBy: {
      members: {
        _count: "desc",
      },
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      inviteCode: true,
      profileId: true,
      updatedAt: true,
      createdAt: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return (
    <div className="max-w-[1064px] w-full h-full mx-auto p-[10px] select-none">
      <div className="bg-card p-[10px] w-full md:hidden rounded-lg mb-5">
        <MobileToggle />
      </div>

      <div className="flex items-center justify-center relative h-[332px] rounded-lg overflow-hidden mb-[25px]">
        <div className="flex flex-col items-center justify-center text-center text-white z-10 px-5 w-full">
          <h2 className="font-bold text-lg mb-[7px]">
            Find your community on Voxrd
          </h2>
          <p className="mb-[15px]">
            From gaming, to music, to learning, there&apos;s a place for you.
          </p>
          <div className="relative text-[#8D7474] w-full max-w-[600px]">
            <Input
              className="rounded-[5px] p-[10px] font-normal text-base bg-white w-full"
              placeholder="Explore communities"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Search />
            </div>
          </div>
        </div>
        <Image
          fill
          src={"/images/discover-cover.png"}
          quality={100}
          alt="discover-cover"
          objectFit="cover"
        />
        d
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[25px] mb-[25px]">
        {servers.map(
          (
            server: Server & {
              _count: {
                members: number;
              };
            }
          ) => (
            <DiscoverItem key={server.id} {...server} />
          )
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
