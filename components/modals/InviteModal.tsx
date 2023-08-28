"use client";

import useModal from "@/hooks/useModalStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Check, Copy } from "lucide-react";
import { useOrigin } from "@/hooks/useOrigin";
import { useState } from "react";

const InviteModal = () => {
  const { isOpen, onClose, type, data } = useModal();

  const origin = useOrigin();

  const isModalOpen = isOpen && type === "invite";

  const { server } = data;

  const [copied, setCopied] = useState(false);

  const inviteUrl = `${origin}/invite/${server?.inviteCode}`;

  const onCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Invite friends to {server?.name}
          </DialogTitle>

          <DialogDescription className="text-center">
            Give your server a personality with a name and an image. You can
            always change it later
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <Label className="uppercase text-xs font-bold text-neutral-600 dark:text-neutral-200/80">
            Server invite link
          </Label>
          <div className="relative">
            <Input className="pr-24" value={inviteUrl} />
            <Button
              size={"sm"}
              className="absolute top-1/2 bottom-1/2 -translate-y-1/2 right-1 flex items-center gap-2 h-8 px-2 rounded-sm"
              onClick={onCopy}
            >
              {copied ? (
                <>
                  Copied
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Copy
                  <Copy className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
