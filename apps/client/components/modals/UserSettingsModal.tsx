"use client";

import * as z from "zod";
import useModal from "@/hooks/useModalStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Camera } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useUserSettings } from "../providers/UserSettingsProvider";
import { useUserMedia } from "../providers/UserMediaProvider";

const formSchema = z.object({
  inputDeviceId: z.string(),
  outputDeviceId: z.string(),
  cameraDeviceId: z.string(),
});

const UserSettingsModal = () => {
  const router = useRouter();
  const { isOpen, onClose, type } = useModal();

  const {
    cameraDeviceId,
    setCameraDeviceId,
    microphoneDeviceId,
    setMicrophoneDeviceId,
  } = useUserSettings();

  const { inputDevices, outputDevices, cameraDevices, getCamera } =
    useUserMedia();

  const [isTestingVideo, setIsTestingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [saved, setSaved] = useState(false);

  const isModalOpen = isOpen && type === "userSettings";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputDeviceId: microphoneDeviceId,
      outputDeviceId: "",
      cameraDeviceId,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (values.cameraDeviceId) {
        setCameraDeviceId(values.cameraDeviceId);
      }

      if (values.inputDeviceId) {
        setMicrophoneDeviceId(values.inputDeviceId);
      }

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (e) {}
  };

  useEffect(() => {
    if (cameraDeviceId && isTestingVideo && videoRef.current !== null) {
      (async () => {
        const track = await getCamera(cameraDeviceId);

        const stream = new MediaStream();
        stream.addTrack(track);

        videoRef.current!.srcObject = stream;
      })();
    }
  }, [isTestingVideo, cameraDeviceId, getCamera]);

  const handleClose = () => {
    onClose();
    setIsTestingVideo(false);
    setSaved(false);
    router.refresh();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 overflow-hidden max-w-full w-screen h-screen border-none sm:rounded-none rounded-none">
        <div className="max-w-4xl w-full mx-auto">
          <DialogHeader className="pt-8 px-6">
            <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>

            <DialogDescription>
              Give your server a personality with a name and an image. You can
              always change it later
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="video-audio"
            className="flex flex-col md:flex-row gap-4 w-full px-6 py-8"
          >
            <TabsList className="flex justify-center md:flex-col gap-1 md:max-w-[200px] w-full h-full">
              <TabsTrigger
                value="video-audio"
                className="w-full items-start justify-start"
              >
                Video & Audio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video-audio" className="w-full">
              <Form {...form}>
                <form
                  onChange={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <div className="text-xl font-semibold">Voice Settings</div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">
                    <FormField
                      control={form.control}
                      name="inputDeviceId"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <Select
                            {...field}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <FormLabel className="uppercase">
                              Input Device
                            </FormLabel>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select audio input device" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {inputDevices.map((device) => {
                                return (
                                  <SelectItem
                                    value={device.deviceId}
                                    key={device.deviceId}
                                  >
                                    {device.label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="outputDeviceId"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <Select
                            {...field}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <FormLabel className="uppercase">
                              Output Device
                            </FormLabel>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select audio output device" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {outputDevices.map((device) => {
                                return (
                                  <SelectItem
                                    value={device.deviceId}
                                    key={device.deviceId}
                                  >
                                    {device.label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="text-xl font-semibold">Video Settings</div>

                  <div className="w-full">
                    <div className="flex flex-col items-center justify-center bg-background border w-full h-52 rounded">
                      {isTestingVideo ? (
                        <video
                          ref={videoRef}
                          muted
                          autoPlay
                          className="h-full"
                        />
                      ) : (
                        <>
                          <Camera className="w-10 h-10" />
                          <Button
                            size={"sm"}
                            variant={"secondary"}
                            className="mt-2"
                            type="button"
                            onClick={() => setIsTestingVideo(true)}
                          >
                            Test Video
                          </Button>
                        </>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="cameraDeviceId"
                      render={({ field }) => (
                        <FormItem className="w-full mt-2">
                          <Select
                            {...field}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <FormLabel className="uppercase">Camera</FormLabel>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select camera device" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cameraDevices.map((device) => {
                                return (
                                  <SelectItem
                                    value={device.deviceId}
                                    key={device.deviceId}
                                  >
                                    {device.label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* <DialogFooter className=" px-6 py-4">
                    <Button disabled={isLoading}>
                      {saved ? <>Saved</> : <>Save changes</>}
                    </Button>
                  </DialogFooter> */}
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsModal;
