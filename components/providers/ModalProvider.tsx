"use client";

import { useEffect, useState } from "react";
import { CreateServerModal } from "../modals/CreateServerModal";
import InviteModal from "../modals/InviteModal";
import ServerSettingsModal from "../modals/ServerSettingsModal";
import CreateChannelModal from "../modals/CreateChannelModal";
import LeaveServerModal from "../modals/LeaveServerModal";
import DeleteServerModal from "../modals/DeleteServerModal";
import EditChannelModal from "../modals/EditChannelModal";
import { MessageFileModal } from "../modals/MessageFileModal";
import DeleteMessageModal from "../modals/DeleteMessageModal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <ServerSettingsModal />
      <CreateChannelModal />
      <CreateServerModal />
      <InviteModal />
      <LeaveServerModal />
      <DeleteServerModal />
      <EditChannelModal />
      <MessageFileModal />
      <DeleteMessageModal />
    </>
  );
};
