"use client";

import * as z from "zod";
import { Member, MemberRole, Profile } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import ActionTooltip from "../ActionTooltip";
import { Edit, FileIcon, ShieldAlert, ShieldCheck, Trash } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Twemoji from "react-twemoji";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import axios from "@/lib/axios";
import useModal from "@/hooks/useModalStore";
import { includesOnlyEmojis } from "@/lib/includesOnlyEmojis";

interface ChatItemProps {
  id: string;
  content: string;
  awaiting?: boolean;
  member: Member & {
    profile: Profile;
  };
  timestamp: string;
  fileUrl: string | null;
  deleted: boolean;
  currentMember: Member;
  isUpdated: boolean;
  socketUrl: string;
}

const roleIconMap = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 ml-2 text-primary" />,
};

const formSchema = z.object({
  content: z.string().min(1),
});

const ChatItem = ({
  id,
  content,
  member,
  timestamp,
  fileUrl,
  deleted,
  currentMember,
  isUpdated,
  socketUrl,
  awaiting,
}: ChatItemProps) => {
  const { onOpen } = useModal();

  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: content,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`${socketUrl}/${id}`, values);

      form.reset();
      setIsEditing(false);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(
    () =>
      form.reset({
        content,
      }),
    [form, content]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "Escape" || e.keyCode === 27) && isEditing) {
        e.preventDefault();
        setIsEditing(false);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [isEditing]);

  const fileType = fileUrl?.split(".").pop();

  const isAdmin = currentMember.role === MemberRole.ADMIN;
  const isModerator = currentMember.role === MemberRole.MODERATOR;
  const isOwner = currentMember.id === member.id;
  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
  const canEditMessage = !deleted && isOwner && !fileUrl;
  const isPDF = fileType === "pdf" && fileUrl;
  const isImage = !isPDF && fileUrl;

  return (
    <div
      className={cn(
        "relative group flex items-center hover:bg-card/20 dark:hover:bg-card/10 transition w-full rounded-xl",
        awaiting && "opacity-30"
      )}
    >
      <div className="group flex gap-x-2 items-start w-full">
        <div className="cursor-pointer hover:drop-shadow-md transition">
          <Avatar>
            <AvatarImage src={member.profile.imageUrl} />
            <AvatarFallback>
              {member.profile.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-2">
            <div className="flex items-center">
              <p className="font-bold text-sm hover:underline cursor-pointer">
                {member.profile.username}
              </p>
              <ActionTooltip label={member.role}>
                {roleIconMap[member.role]}
              </ActionTooltip>
            </div>
            <span className="text-xs font-normal text-foreground/50">
              {timestamp}
            </span>
          </div>
          {isImage && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener norefeerer"
              className="relative aspect-square rounded-md mt-2 overflow-hidden flex items-center bg-secondary h-48 w-48"
            >
              <Image
                fill
                src={fileUrl}
                alt={content}
                className="object-cover"
              />
            </a>
          )}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md">
              <FileIcon className="h-10 w-10 fill-primary/30 stroke-primary/70" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-primary hover:underline"
              >
                PDF File
              </a>
            </div>
          )}
          {!fileUrl && !isEditing && (
            <Twemoji>
              <p
                className={cn(
                  "text-sm font-medium text-foreground w-full flex gap-1 flex-wrap break-all",
                  deleted && "italic text-foreground/80 text-xs mt-1",
                  includesOnlyEmojis(content)
                    ? "[&>img]:w-8"
                    : "[&>img]:w-5 [&>img]:h-5"
                )}
              >
                {content}
                {isUpdated && !deleted && (
                  <span className="text-[10px] flex-none mx-2 text-foreground/70">
                    (edited)
                  </span>
                )}
              </p>
            </Twemoji>
          )}
          {!fileUrl && isEditing && (
            <Form {...form}>
              <form
                className="flex items-center w-full gap-x-2 pt-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            disabled={isLoading}
                            className="bg-card"
                            placeholder="Edited Message"
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button size={"sm"} disabled={isLoading}>
                  Save
                </Button>
              </form>
              <span className="text-[10px] mt-1 text-foreground/70">
                Press escape to cancel, enter to save
              </span>
            </Form>
          )}
        </div>
      </div>
      {!awaiting && canDeleteMessage && (
        <div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-card border rounded-sm text-foreground/70">
          {canEditMessage && (
            <ActionTooltip label="Edit">
              <Edit
                className="cursor-pointer ml-auto h-4 w-4"
                onClick={() => setIsEditing(true)}
              />
            </ActionTooltip>
          )}

          <ActionTooltip label="Delete">
            <Trash
              className="cursor-pointer ml-auto h-4 w-4"
              onClick={() =>
                onOpen("deleteMessage", {
                  apiUrl: `${socketUrl}/${id}`,
                })
              }
            />
          </ActionTooltip>
        </div>
      )}
    </div>
  );
};

export default ChatItem;
