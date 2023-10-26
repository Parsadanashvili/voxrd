import axios from "@/lib/axios";
import { create } from "zustand";

type MessagesStackType = {
  messageRequestsStack: {
    apiUrl: string;
    channelId: string;
    values: {
      content: string;
    };
  }[];
  sendMessage: (content: {
    apiUrl: string;
    channelId: string;
    values: {
      content: string;
    };
  }) => Promise<void>;
  removeMessage: (content: { channelId: string; value: string }) => void;
};

export const useMessagesStack = create<MessagesStackType>((set) => ({
  messageRequestsStack: [],
  sendMessage: async (message) => {
    set(({ messageRequestsStack }) => ({
      messageRequestsStack: [message, ...messageRequestsStack],
    }));

    await axios.post(message.apiUrl, message.values);
  },
  removeMessage: ({ channelId, value }) => {
    set(({ messageRequestsStack }) => ({
      messageRequestsStack: messageRequestsStack.filter((message) => {
        if (
          !message.apiUrl.includes(`/${channelId}/`) &&
          message.values.content !== value
        ) {
          return message;
        }
      }),
    }));
  },
}));
