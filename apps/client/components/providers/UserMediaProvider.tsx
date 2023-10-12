"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useUserSettings } from "./UserSettingsProvider";

interface UserMediaContextType {
  activeMicrophone?: MediaStreamTrack;
  activeCamera?: MediaStreamTrack;

  userMediaError?: string;

  cameraDevices: MediaDeviceInfo[];

  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];

  getCamera: (deviceId: string) => Promise<MediaStreamTrack>;
  changeActiveCamera: (deviceId: string) => Promise<void>;
  stopActiveCamera: () => void;

  getMicrophone: (deviceId: string) => Promise<MediaStreamTrack>;
  changeActiveMicrophone: (deviceId: string) => Promise<void>;
  stopActiveMicrophone: () => void;
}

const UserMediaContext = createContext({} as UserMediaContextType);

type UserMediaProviderProps = {
  children: React.ReactNode;
};

const defaultAudioConstraints: MediaTrackConstraints = {
  autoGainControl: true,
  echoCancellation: true,
  noiseSuppression: true,
  channelCount: 1,
};

const defaultCameraOption = {
  video: {},
};

const defaultMicrophoneOption = {
  audio: { ...defaultAudioConstraints },
};

const noCameraOption = {
  video: false,
};

const noMicrophoneOption = {
  audio: false,
};

export const UserMediaProvider = ({ children }: UserMediaProviderProps) => {
  const { setCameraDeviceId, setMicrophoneDeviceId, micMuted } =
    useUserSettings();

  const [activeMicrophone, setActiveMicrophone] = useState<MediaStreamTrack>();
  const [activeCamera, setActiveCamera] = useState<MediaStreamTrack>();

  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [userMediaError, setUserMediaError] = useState<string>();

  const loadDevices = useCallback(async () => {
    const availableDevices = await navigator.mediaDevices.enumerateDevices();

    const audioInputDevices = availableDevices.filter(
      (device) => device.kind === "audioinput"
    );
    setInputDevices(audioInputDevices);

    const audioOutputDevices = availableDevices.filter(
      (device) => device.kind === "audiooutput"
    );
    setOutputDevices(audioOutputDevices);

    const videoInputDevices = availableDevices.filter(
      (device) => device.kind === "videoinput"
    );
    setCameraDevices(videoInputDevices);
  }, []);

  const getMicrophone = useCallback(
    async (deviceId: string) => {
      let options = {
        ...defaultMicrophoneOption,
        ...noCameraOption,
      };
      if (deviceId !== "") {
        options["audio"] = {
          deviceId: { exact: deviceId },
          ...defaultAudioConstraints,
        };
      }

      let tracks: MediaStreamTrack[] = [];

      try {
        tracks = (
          await navigator.mediaDevices.getUserMedia(options)
        ).getTracks();
      } catch (e) {
        if (e instanceof Error) {
          if (
            e.name == "NotAllowedError" ||
            e.name == "PermissionDeniedError" ||
            e instanceof DOMException
          ) {
            setUserMediaError("NotAllowedError");
          } else if (
            e.name == "OverconstrainedError" ||
            e.name == "ConstraintNotSatisfiedError"
          ) {
            setUserMediaError("OverconstrainedError");
          } else {
            setUserMediaError(e.name);
          }
        }
      }

      tracks.forEach((track) => {
        switch (track.kind) {
          case "audio":
            setActiveMicrophone(track);

            const settings = track.getSettings();

            if (settings.deviceId) {
              setMicrophoneDeviceId(settings.deviceId);
            }
            break;
        }
      });

      return tracks[0];
    },
    [setMicrophoneDeviceId]
  );

  const changeActiveMicrophone = useCallback(
    async (deviceId: string) => {
      await getMicrophone(deviceId);
    },
    [getMicrophone]
  );

  const stopActiveMicrophone = useCallback(() => {
    if (activeMicrophone) {
      activeMicrophone.stop();
      setActiveMicrophone(undefined);
    }
  }, [activeMicrophone]);

  const getCamera = useCallback(
    async (deviceId: string) => {
      let options = {
        ...defaultCameraOption,
        ...noMicrophoneOption,
      };

      if (deviceId !== "") {
        options["video"] = {
          constraints: {
            deviceId: { exact: deviceId },
          },
        };
      }

      let tracks: MediaStreamTrack[] = [];

      try {
        tracks = (
          await navigator.mediaDevices.getUserMedia(options)
        ).getTracks();
      } catch (e) {
        if (e instanceof Error) {
          if (
            e.name == "NotAllowedError" ||
            e.name == "PermissionDeniedError" ||
            e instanceof DOMException
          ) {
            setUserMediaError("NotAllowedError");
          } else if (
            e.name == "OverconstrainedError" ||
            e.name == "ConstraintNotSatisfiedError"
          ) {
            setUserMediaError("OverconstrainedError");
          } else {
            setUserMediaError(e.name);
          }
        }
      }

      tracks.forEach((track) => {
        switch (track.kind) {
          case "video":
            setActiveCamera(track);

            const settings = track.getSettings();

            if (settings.deviceId) {
              setCameraDeviceId(settings.deviceId);
            }
            break;
        }
      });

      return tracks[0];
    },
    [setCameraDeviceId]
  );

  const changeActiveCamera = useCallback(
    async (deviceId: string) => {
      await getCamera(deviceId);
    },
    [getCamera]
  );

  const stopActiveCamera = useCallback(() => {
    if (activeCamera) {
      activeCamera.stop();
      setActiveCamera(undefined);
    }
  }, [activeCamera]);

  const onDeviceChange = useCallback(async () => {
    await loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        onDeviceChange
      );
    };
  }, [onDeviceChange]);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (micMuted && activeMicrophone?.enabled) {
      activeMicrophone.enabled = false;
    } else if (!micMuted && !!activeMicrophone && !activeMicrophone.enabled) {
      activeMicrophone.enabled = true;
    }
  }, [micMuted, activeMicrophone]);

  useEffect(() => {
    return () => {
      console.log("stop active tracks");

      stopActiveCamera();
      stopActiveMicrophone();
    };
  }, []);

  return (
    <UserMediaContext.Provider
      value={{
        activeMicrophone,
        activeCamera,
        userMediaError,
        cameraDevices,
        inputDevices,
        outputDevices,
        getCamera,
        changeActiveCamera,
        stopActiveCamera,
        getMicrophone,
        changeActiveMicrophone,
        stopActiveMicrophone,
      }}
    >
      {children}
    </UserMediaContext.Provider>
  );
};

export const useUserMedia = () => {
  const ctx = useContext(UserMediaContext);

  useEffect(() => {
    return () => {
      console.log("stop active tracks");

      ctx.stopActiveCamera();
      ctx.stopActiveMicrophone();
    };
  }, []);

  return ctx;
};
