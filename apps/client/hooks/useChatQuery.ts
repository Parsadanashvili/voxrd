import { useSocket } from "@/components/providers/SocketProvider";
import { env } from "@/env";
import axios from "@/lib/axios";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useMessagesStack } from "./useMessagesStack";

interface ChatQueryProps {
  queryKey: string;
  apiUrl: string;
}

export const useChatQuery = ({ queryKey, apiUrl }: ChatQueryProps) => {
  const { isConnected } = useSocket();
  const { removeMessage } = useMessagesStack();

  const fetchMessages = async ({ pageParam = undefined }) => {
    let url = `${env.NEXT_PUBLIC_API_URL}${apiUrl}`;

    if (pageParam != undefined) {
      url += `?cursor=${pageParam}`;
    }

    const res = await axios(url);
    return res.data;

    // const res = await fetch(url);
    // return await res.json();
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: [queryKey],
      queryFn: fetchMessages,
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      refetchInterval: isConnected ? false : 1000,
    });

  useEffect(() => {
    const value = data?.pages[0]?.items?.[0]?.content;
    const channelId = data?.pages[0]?.items?.[0]?.channelId;

    removeMessage({ channelId, value });
  }, [data]);

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  };
};
