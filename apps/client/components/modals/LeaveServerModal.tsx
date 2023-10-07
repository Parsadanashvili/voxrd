"use client";

import useModal from "@/hooks/useModalStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LeaveServerModal = () => {
  const router = useRouter();
  const { isOpen, onClose, type, data } = useModal();

  const isModalOpen = isOpen && type === "leaveServer";
  const { server } = data;

  const [isLoading, setIsLoading] = useState(false);

  const handleLeaveServer = async () => {
    if (!server) return;
    try {
      setIsLoading(true);
      await axios.patch(`/api/servers/${server.id}/leave`);
      router.refresh();
      onClose();
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl font-bold">
            Leave &apos;{server?.name}&apos;
          </DialogTitle>

          <DialogDescription>
            Are you sure you want to leave{" "}
            <span className="font-bold text-white">
              &apos;{server?.name}&apos;
            </span>
            ? You won&apos;t be able to rejoin this server unless you are
            re-invited.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className=" px-6 py-4">
          <Button
            variant={"secondary"}
            onClick={() => onClose()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={() => handleLeaveServer()} disabled={isLoading}>
            Leave Server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveServerModal;
