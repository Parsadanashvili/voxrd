import DiscoverSidebar from "@/components/discover/DiscoverSidebar";

const ServerLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full">
      <div className="hidden md:flex h-full max-h-[calc(100%-70px)] w-[230px] z-20 flex-col fixed inset-y-0 py-[10px]">
        <DiscoverSidebar />
      </div>
      <div className="flex flex-row gap-x-[10px] h-full w-full md:pl-60">
        {children}
      </div>
    </div>
  );
};

export default ServerLayout;
