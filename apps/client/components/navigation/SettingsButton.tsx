"use client";

import { Settings } from "lucide-react";
import { Button } from "../ui/button";
import useModal from "@/hooks/useModalStore";

const SettingsButton = () => {
  const { onOpen } = useModal();

  const handleClick = () => onOpen("userSettings");

  return (
    <Button size={"icon"} variant={"ghost"} onClick={handleClick}>
      <Settings className="w-4 h-4" />
    </Button>
  );
};

export default SettingsButton;
