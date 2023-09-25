import { useSocket } from "@/components/providers/SocketProvider";
import axios from "@/lib/axios";
import { useInfiniteQuery } from "@tanstack/react-query";

interface ChatQueryProps {
  queryKey: string;
  apiUrl: string;
}

export const useChatQuery = ({ queryKey, apiUrl }: ChatQueryProps) => {
  const { isConnected } = useSocket();

  const fetchMessages = async ({ pageParam = undefined }) => {
    let url = process.env.NEXT_PUBLIC_API_URL + `${apiUrl}`;

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

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  };
};
