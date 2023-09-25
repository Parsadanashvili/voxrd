import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { UserButton } from "@clerk/nextjs";
import NavigationAction from "./NavigationAction";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import NavigationItem from "./NavigationItem";
import { ModeToggle } from "../ModeToggle";
import { redirect } from "next/navigation";

const NavigationDivider = () => {
  return (
    <Separator className="bg-[#8E8080] dark:bg-card rounded-full h-[3px] w-[15px] mx-auto my-[5px]" />
  );
};

const NavigationSidebar = async () => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/login");
  }

  const servers = await db.server.findMany({
    where: {
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  return (
    <div className="relative flex flex-col pt-[10px] h-full w-full text-primary">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-[10px] ml-[10px]">
          {servers.map((server) => (
            <NavigationItem
              key={server.id}
              id={server.id}
              name={server.name}
              imageUrl={server.imageUrl}
            />
          ))}
          {!!servers.length && <NavigationDivider />}
          <NavigationAction />
        </div>
      </ScrollArea>

      <div className="pb-[10px] mt-auto flex items-center flex-col gap-y-[10px] ml-[10px]"></div>

      <div className="absolute left-full bottom-0 m-[10px] z-50 w-[230px]">
        <div className="flex items-center bg-card text-foreground p-[10px] rounded-[10px] space-x-[10px]">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-[40px] w-[40px]",
              },
            }}
          />

          <div className="flex flex-1 flex-col items-start">
            <p className="font-bold text-xs">{profile.username}</p>
            <span className="text-[10px]">online</span>
          </div>

          <ModeToggle />
        </div>
      </div>
    </div>
  );
};

export default NavigationSidebar;
