"use client";

import useLocalStorageStore from "@/hooks/useLocalStorageStore";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

interface UserSettingsContextType {
  interactionRequired: boolean;
  setInteractionRequired: (requiresInteraction: boolean) => void;
  micMuted: boolean;
  setMicMuted: Dispatch<SetStateAction<boolean>>;
  cameraOff: boolean;
  setCameraOff: Dispatch<SetStateAction<boolean>>;
  microphoneDeviceId: string;
  setMicrophoneDeviceId: (deviceId: string) => void;
  cameraDeviceId: string;
  setCameraDeviceId: (deviceId: string) => void;
}

const UserSettingsContext = createContext({} as UserSettingsContextType);

interface UserSettingsProviderProps {
  children: React.ReactNode;
}

export const UserSettingsProvider = ({
  children,
}: UserSettingsProviderProps) => {
  const [interactionRequired, setInteractionRequired] = useState(true);

  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(true);

  const [microphoneDeviceId, setMicrophoneDeviceId] =
    useLocalStorageStore<string>("audioDeviceId", "");
  const [cameraDeviceId, setCameraDeviceId] = useLocalStorageStore<string>(
    "videoDeviceId",
    ""
  );

  return (
    <UserSettingsContext.Provider
      value={{
        interactionRequired,
        setInteractionRequired,
        micMuted,
        setMicMuted,
        cameraOff,
        setCameraOff,
        microphoneDeviceId,
        setMicrophoneDeviceId,
        cameraDeviceId,
        setCameraDeviceId,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => {
  const ctx = useContext(UserSettingsContext);

  return ctx;
};
