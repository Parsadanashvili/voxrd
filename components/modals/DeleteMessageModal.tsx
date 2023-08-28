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
import axios from "axios";
import { useState } from "react";

const DeleteMessageModal = () => {
  const { isOpen, onClose, type, data } = useModal();

  const isModalOpen = isOpen && type === "deleteMessage";
  const { apiUrl } = data;

  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteMessage = async () => {
    if (!apiUrl) return;
    try {
      setIsLoading(true);
      await axios.delete(apiUrl);
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
            Delete Message
          </DialogTitle>

          <DialogDescription>
            Are you sure you want to delete this message?
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
          <Button onClick={() => handleDeleteMessage()} disabled={isLoading}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMessageModal;
