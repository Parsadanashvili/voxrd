"use client";

import { cn } from "@/lib/utils";
import { Compass, Gamepad, Music } from "lucide-react";
import { useState } from "react";

const menuItems = [
  {
    id: 1,
    Icon: Compass,
    name: "Home",
  },
  {
    id: 2,
    Icon: Gamepad,
    name: "Gaming",
  },
  {
    id: 2,
    Icon: Music,
    name: "Music",
  },
];

const DiscoverSidebar = () => {
  const [selectedItem, setSelectedItem] = useState(1);

  return (
    <div className="flex flex-col h-full w-full bg-card rounded-[10px]">
      <div className="p-5">
        <p className="text-foreground text-lg font-bold">Discover</p>
      </div>
      <div className="px-[5px] space-y-1">
        {menuItems.map(({ id, name, Icon }) => (
          <button
            key={id}
            className={cn(
              "group px-[10px] py-2 rounded-[5px] flex items-center gap-x-2 w-full text-[#8E8080] hover:bg-background hover:text-foreground dark:hover:bg-[#2F2A2A] transition",
              selectedItem === id &&
                "bg-primary text-white hover:bg-primary hover:text-white-500 dark:hover:bg-primary"
            )}
          >
            <Icon className="flex-shrink-0 w-5 h-5" />
            <p className={"line-clamp-1 font-medium"}>{name}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DiscoverSidebar;
