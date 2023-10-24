import axios from "@/lib/axios";
import { create } from "zustand";

type MessagesStackType = {
  messageRequestsStack: {
    apiUrl: string;
    values: {
      content: string;
    };
  }[];
  sendMessage: (content: {
    apiUrl: string;
    values: {
      content: string;
    };
  }) => Promise<void>;
};

export const useMessagesStack = create<MessagesStackType>((set) => ({
  messageRequestsStack: [],
  sendMessage: async (message) => {
    set(({ messageRequestsStack }) => ({
      messageRequestsStack: [...messageRequestsStack, message],
    }));

    await axios.post(message.apiUrl, message.values);

    set(({ messageRequestsStack }) => ({
      messageRequestsStack: messageRequestsStack.filter((stack) => {
        if (
          stack.apiUrl !== message.apiUrl &&
          stack.values.content !== message.values.content
        ) {
          return stack;
        }
      }),
    }));
  },
}));
