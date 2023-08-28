"use client";

import { Plus } from "lucide-react";
import ActionTooltip from "../ActionTooltip";
import useModal from "@/hooks/useModalStore";

const NavigationAction = () => {
  const { onOpen } = useModal();

  return (
    <div>
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
    </div>
  );
};

export default NavigationAction;
