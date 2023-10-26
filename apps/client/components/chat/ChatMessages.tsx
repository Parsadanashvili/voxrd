"use client";

import { format } from "date-fns";
import { Member, Message, Profile } from "@prisma/client";
import ChatWelcome from "./ChatWelcome";
import { useChatQuery } from "@/hooks/useChatQuery";
import { Loader2, ServerCrash } from "lucide-react";
import {
  ElementRef,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ChatItem from "./ChatItem";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useMessagesStack } from "@/hooks/useMessagesStack";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile;
  };
};

interface ChatMessagesProps {
  name: string;
  member: Member & { profile: Profile };
  chatId: string;
  channelId: string;
  apiUrl: string;
  socketUrl: string;
}

const ChatMessages = ({
  name,
  member,
  chatId,
  apiUrl,
  socketUrl,
  channelId,
}: ChatMessagesProps) => {
  const queryKey = `chat:${chatId}`;
  const addKey = `chat:${chatId}:messages`;
  const updateKey = `chat:${chatId}:messages:update`;
  const { messageRequestsStack } = useMessagesStack();

  const awaitingChannelMessages = useMemo(
    () =>
      messageRequestsStack.filter((message) => message.channelId === channelId),
    [messageRequestsStack, channelId]
  );

  console.log(awaitingChannelMessages);

  const chatRef = useRef<ElementRef<"div">>(null);
  const bottomRef = useRef<ElementRef<"div">>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({
      apiUrl,
      queryKey,
    });

  useChatSocket({
    queryKey,
    addKey,
    updateKey,
  });

  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  });

  return (
    <div
      className="flex flex-col flex-1 px-[10px] py-[20px] overflow-y-auto"
      ref={chatRef}
    >
      {status === "loading" ? (
        <div className="flex flex-col flex-1 justify-center items-center text-foreground/80">
          <Loader2 className="animate-spin h-7 w-7 my-4" />
          <p className="text-xs ">Loading messages...</p>
        </div>
      ) : status === "error" ? (
        <div className="flex flex-col flex-1 justify-center items-center text-foreground/80">
          <ServerCrash className="h-7 w-7 text-destructive my-4" />
          <p className="text-xs">Something went wrong!</p>
        </div>
      ) : (
        <>
          {!hasNextPage && <div className="flex-1" />}
          {!hasNextPage && <ChatWelcome name={name} />}
          {hasNextPage && (
            <div className="flex justify-center">
              {isFetchingNextPage ? (
                <Loader2 className="h-6 w-6 text-foreground/80 animate-spin my-4" />
              ) : (
                <button
                  onClick={() => fetchNextPage()}
                  className="text-foreground/80 hover:text-foreground my-4 text-sm"
                >
                  Load previous messages
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse mt-auto gap-y-[10px]">
            {awaitingChannelMessages.map((message, index) => (
              <ChatItem
                awaiting
                key={index}
                id={index.toString()}
                content={message.values.content}
                fileUrl={""}
                deleted={false}
                timestamp={format(new Date(), DATE_FORMAT)}
                isUpdated={false}
                socketUrl={socketUrl}
                member={member}
                currentMember={member}
              />
            ))}
            {data?.pages?.map((group, i) => (
              <Fragment key={i}>
                {group?.items.map((message: MessageWithMemberWithProfile) => (
                  <ChatItem
                    key={message.id}
                    id={message.id}
                    content={message.content}
                    fileUrl={message.fileUrl}
                    deleted={message.deleted}
                    timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
                    isUpdated={message.updatedAt !== message.createdAt}
                    socketUrl={socketUrl}
                    member={message.member}
                    currentMember={member}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
