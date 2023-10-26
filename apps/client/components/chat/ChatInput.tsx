"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import { PlusCircle, Smile } from "lucide-react";
import EmojiPicker, { type Theme, EmojiStyle } from "emoji-picker-react";

import useModal from "@/hooks/useModalStore";
import { useRef, useState } from "react";
import { useOutSideClick } from "@/hooks/useOutSideClick";
import { useTheme } from "next-themes";
import { useMessagesStack } from "@/hooks/useMessagesStack";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
  channelId: string
}

const formSchema = z.object({
  content: z.string().min(1),
});

const ChatInput = ({ apiUrl, name, channelId }: ChatInputProps) => {
  const { onOpen } = useModal();
  const [openEmojis, setOpenEmojis] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { sendMessage } = useMessagesStack();
  useOutSideClick(emojiRef, () => setOpenEmojis(false));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    form.reset();
    try {
      await sendMessage({ apiUrl, values, channelId });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Form {...form}>
      {openEmojis && (
        <div ref={emojiRef} className="absolute bottom-10 right-2 z-10">
          <EmojiPicker
            previewConfig={{}}
            theme={theme as Theme}
            emojiStyle={EmojiStyle.TWITTER}
            onEmojiClick={(emoji) =>
              form.setValue(
                "content",
                `${form.getValues("content") + emoji.emoji}`
              )
            }
          />
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <FormField
          name="content"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center relative px-[10px] rounded-[10px] bg-card dark:text-[#7C7474]">
                  <button
                    type="button"
                    onClick={() =>
                      onOpen("messageFile", {
                        apiUrl,
                      })
                    }
                    className="mr-[10px]"
                  >
                    <PlusCircle className="w-[20px] h-[20px]" />
                  </button>
                  <Input
                    disabled={isLoading}
                    className="bg-transparent px-0 flex-1"
                    placeholder={`Message #${name}`}
                    autoComplete="off"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setOpenEmojis(true)}
                    className="ml-[10px]"
                  >
                    <Smile className="w-[20px] h-[20px]" />
                  </button>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default ChatInput;
