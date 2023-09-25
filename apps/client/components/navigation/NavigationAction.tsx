"use client";

import { Compass, Plus } from "lucide-react";
import ActionTooltip from "../ActionTooltip";
import useModal from "@/hooks/useModalStore";
import { useRouter } from "next/navigation";

const NavigationAction = () => {
  const router = useRouter();
  const { onOpen } = useModal();

  return (
    <div className="flex flex-col gap-[10px]">
      <ActionTooltip side="right" align="center" label="Add a server">
        <button className="group" onClick={() => onOpen("createServer")}>
          <div className="flex mx-auto h-[45px] w-[45px] rounded-[25px] group-hover:rounded-lg transition-all overflow-hidden items-center justify-center bg-card group-hover:bg-green">
            <Plus
              className="group-hover:text-white transition text-green"
              size={25}
            />
          </div>
        </button>
      </ActionTooltip>

      <ActionTooltip side="right" align="center" label="Discover servers">
        <button className="group" onClick={() => router.push("/discover")}>
          <div className="flex mx-auto h-[45px] w-[45px] rounded-[25px] group-hover:rounded-lg transition-all overflow-hidden items-center justify-center bg-card group-hover:bg-green">
            <Compass
              className="group-hover:text-white transition text-green"
              size={25}
            />
          </div>
        </button>
      </ActionTooltip>
    </div>
  );
};

export default NavigationAction;
