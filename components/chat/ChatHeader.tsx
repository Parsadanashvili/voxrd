import { Hash, Menu } from "lucide-react";
import MobileToggle from "../MobileToggle";
import SocketIndicator from "../SocketIndicator";

interface ChatHeaderProps {
  serverId: string;
  name: string;
  onMembersToggle: (open: boolean) => void;
}

const ChatHeader = ({ serverId, name, onMembersToggle }: ChatHeaderProps) => {
  return (
    <div className="text-sm font-bold p-[10px] flex items-center rounded-[10px] bg-card text-card-foreground">
      <div className="flex items-center w-full">
        <MobileToggle serverId={serverId} />
        <Hash className="w-5 h-5" />
        <p className="ml-[10px]">{name}</p>

        <div className="ml-auto flex items-center">
          <SocketIndicator />
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
