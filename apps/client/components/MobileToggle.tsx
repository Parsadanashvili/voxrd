import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import NavigationSidebar from "./navigation/NavigationSidebar";
import ServerSidebar from "./server/ServerSidebar";

const MobileToggle = ({ serverId }: { serverId: string }) => {
  return (
    <Sheet>
      <SheetTrigger>
        <Button variant={"ghost"} size={"icon"} className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={"left"}
        className="p-0 flex gap-0 bg-background w-auto pr-[10px]"
      >
        <div className="w-[55px] mr-[10px]">
          <NavigationSidebar />
        </div>
        <div className="max-h-[calc(100%-70px)] h-full w-[230px] z-20 flex-col py-[10px]">
          <ServerSidebar serverId={serverId} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileToggle;
