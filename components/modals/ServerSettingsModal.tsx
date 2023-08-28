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
import { useEffect, useState } from "react";
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
import { Input } from "../ui/input";
import FileUpload from "../FileUpload";
import { useUploadThing } from "@/lib/uploadthing";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ServerWithChannelWithMembers } from "../server/types";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Check,
  Gavel,
  Loader2,
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MemberRole } from "@prisma/client";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Server name is required",
  }),
  imageUrl: z.array(z.any()).max(1, {
    message: "Server image is required",
  }),
});

const roleIconMap = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 ml-2 text-primary" />,
};
const ServerSettingsModal = () => {
  const router = useRouter();
  const { isOpen, onOpen, onClose, type, data } = useModal();

  const [loadingId, setLoadingId] = useState("");

  const [saved, setSaved] = useState(false);

  const isModalOpen = isOpen && type === "serverSettings";
  const { server } = data as { server: ServerWithChannelWithMembers };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      imageUrl: [],
    },
  });

  const { startUpload } = useUploadThing("serverImage");

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let image = null;

      if (values.imageUrl.length > 0) {
        const uploadRes = await startUpload(values.imageUrl);

        if (uploadRes?.[0].url) {
          image = uploadRes?.[0].url;
        }
      }

      const res = await axios.patch(`/api/servers/${server?.id}`, {
        name: values.name,
        imageUrl: image,
      });

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (e) {}
  };

  const onRoleChange = async (memberId: string, role: MemberRole) => {
    try {
      if (loadingId) return;

      setLoadingId(memberId);

      const res = await axios.patch(
        `/api/servers/${server.id}/members/${memberId}`,
        {
          role,
        }
      );

      router.refresh();
      onOpen("serverSettings", { server: res.data });
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingId("");
    }
  };

  const onKick = async (memberId: string) => {
    try {
      if (loadingId) return;

      setLoadingId(memberId);

      const res = await axios.delete(
        `/api/servers/${server.id}/members/${memberId}`
      );

      router.refresh();
      onOpen("serverSettings", { server: res.data });
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingId("");
    }
  };

  const handleClose = () => {
    onClose();
    router.refresh();
  };

  useEffect(() => {
    if (server) {
      form.setValue("name", server.name);
    }
  }, [server, form]);

  if (!server) {
    return null;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 overflow-hidden max-w-full w-screen h-screen border-none sm:rounded-none rounded-none">
        <div className="max-w-4xl w-full mx-auto">
          <DialogHeader className="pt-8 px-6">
            <DialogTitle className="text-2xl font-bold">
              Server Settings
            </DialogTitle>

            <DialogDescription>
              Give your server a personality with a name and an image. You can
              always change it later
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="overview"
            className="flex flex-col md:flex-row gap-4 w-full px-6 py-8"
          >
            <TabsList className="flex justify-center md:flex-col gap-1 md:max-w-[200px] w-full h-full">
              <TabsTrigger
                value="overview"
                className="w-full items-start justify-start"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="manage-members"
                className="w-full items-start justify-start"
              >
                Manage Members
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="w-full">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8 my-8"
                >
                  <div className="flex gap-4 flex-col sm:flex-row w-full px-6">
                    <div className="flex items-center justify-center text-center">
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <FileUpload
                                label="Upload"
                                rounded={"full"}
                                maxFiles={1}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Server name</FormLabel>
                          <FormControl>
                            <Input
                              disabled={isLoading}
                              placeholder="Enter server name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter className=" px-6 py-4">
                    <Button disabled={isLoading}>
                      {saved ? <>Saved</> : <>Save changes</>}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="manage-members" className="w-full">
              <div className="flex items-center text-neutral-600 dark:text-neutral-200/80 uppercase text-sm font-bold">
                {server.members.length} members
                {loadingId !== "" && (
                  <Loader2 className="animate-spin ml-4 w-4 h-4" />
                )}
              </div>
              <ScrollArea className="mt-5">
                {server.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-x-2 py-3 border-b border-border "
                  >
                    <Avatar>
                      <AvatarImage src={member.profile.imageUrl} />
                      <AvatarFallback>
                        {member.profile.username.charAt(0).toLocaleUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-y-1">
                      <div className="flex text-xs font-semibold items-center">
                        {member.profile.username}
                        {roleIconMap[member.role]}
                      </div>
                      <p className="text-xs">{member.profile.email}</p>
                    </div>

                    {server.profileId !== member.profileId && (
                      <div className="ml-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger disabled={loadingId !== ""}>
                            <Button variant={"ghost"} size={"icon"}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="left">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="flex items-center">
                                <ShieldQuestion className="w-4 h-4 mr-2" />

                                <span>Role</span>
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onRoleChange(member.id, "GUEST")
                                    }
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    <span className="mr-2">Guest</span>
                                    {member.role === "GUEST" && (
                                      <Check className="w-4 h-4 ml-auto" />
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      onRoleChange(member.id, "MODERATOR")
                                    }
                                  >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    <span className="mr-2">Moderator</span>
                                    {member.role === "MODERATOR" && (
                                      <Check className="w-4 h-4 ml-auto" />
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onKick(member.id)}>
                              <Gavel className="w-4 h-4 mr-2" />
                              Kick
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServerSettingsModal;
