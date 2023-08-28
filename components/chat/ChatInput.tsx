"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import { Plus, PlusCircle, Smile } from "lucide-react";
import { Button } from "../ui/button";
import axios from "axios";
import useModal from "@/hooks/useModalStore";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
}

const formSchema = z.object({
  content: z.string().min(1),
});

const ChatInput = ({ apiUrl, query, name }: ChatInputProps) => {
  const { onOpen } = useModal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(apiUrl, values);

      form.reset();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
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
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => {}}
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
