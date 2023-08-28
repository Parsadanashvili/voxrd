import ServerSidebar from "@/components/server/ServerSidebar";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const ServerLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) => {
  return (
    <div className="h-full">
      <div className="hidden md:flex h-full max-h-[calc(100%-70px)] w-[230px] z-20 flex-col fixed inset-y-0 py-[10px]">
        <ServerSidebar serverId={params.id} />
      </div>
      <div className="flex flex-row gap-x-[10px] h-full w-full md:pl-60">
        {children}
      </div>
    </div>
  );
};

export default ServerLayout;
