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

const DeleteServerModal = () => {
  const router = useRouter();
  const { isOpen, onClose, type, data } = useModal();

  const isModalOpen = isOpen && type === "deleteServer";
  const { server } = data;

  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteServer = async () => {
    if (!server) return;
    try {
      setIsLoading(true);
      await axios.delete(`/api/servers/${server.id}`);
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
            Delete &apos;{server?.name}&apos;
          </DialogTitle>

          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-bold text-white">
              &apos;{server?.name}&apos;
            </span>
            ? This action cannot be undone.
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
          <Button onClick={() => handleDeleteServer()} disabled={isLoading}>
            Delete Server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteServerModal;
