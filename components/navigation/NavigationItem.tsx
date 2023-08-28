"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import ActionTooltip from "../ActionTooltip";
import { Separator } from "../ui/separator";

interface NavigationItemProps {
  id: string;
  imageUrl: string;
  name: string;
}

const NavigationItem = ({ id, imageUrl, name }: NavigationItemProps) => {
  const params = useParams();
  const router = useRouter();

  const onClick = () => {
    if (params?.id !== id) {
      router.push(`/servers/${id}`);
    }
  };

  return (
    <ActionTooltip side="right" align="center" label={name}>
      <button onClick={onClick} className="group flex items-center">
        <Separator
          orientation="vertical"
          className={cn(
            "absolute left-0 bg-[#101010] dark:bg-[#F9F9F9] rounded-full transition-all w-[3px]",
            params?.id !== id && "group-hover:h-[17px]",
            params?.id === id ? "h-[25px]" : "h-0"
          )}
        />
        <div
          className={cn(
            "relative group flex h-[45px] w-[45px] rounded-[25px] group-hover:rounded-lg transition-all overflow-hidden items-center justify-center bg-card",
            params?.id === id && "rounded-lg"
          )}
        >
          <Image fill src={imageUrl} alt={name} objectFit="cover" />
        </div>
      </button>
    </ActionTooltip>
  );
};

export default NavigationItem;
