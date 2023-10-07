"use client";

import useModal from "@/hooks/useModalStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChannelType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Hash, Volume2 } from "lucide-react";
import axios from "@/lib/axios";

const formSchema = z.object({
  name: z
    .string()
    .min(3, {
      message: "Channel name is required",
    })
    .refine((name) => name !== "general", {
      message: 'Channel name cannot be "general"',
    }),
  type: z.nativeEnum(ChannelType),
});

const CreateChannelModal = () => {
  const router = useRouter();

  const { isOpen, onClose, type, data } = useModal();
  const { server } = data;
  const isModalOpen = isOpen && type === "createChannel";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: ChannelType.TEXT,
    },
  });
  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!server) return;
    try {
      await axios.post(`/api/servers/${server.id}/channels`, values);

      form.reset();
      router.refresh();
      onClose();
    } catch (e) {
      console.log(e);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl font-bold">
            Create channel
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-semibold uppercase">
                      Channel type
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex flex-row items-center rounded-lg border p-4 space-y-0">
                          <Hash className="h-5 w-5 mr-4" />
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Text</FormLabel>
                            <FormDescription className="text-xs">
                              Send messages, images, GIFs, emojis, opinions and
                              more...
                            </FormDescription>
                          </div>
                          <FormControl className="ml-auto">
                            <RadioGroupItem value={ChannelType.TEXT} />
                          </FormControl>
                        </FormItem>

                        <FormItem className="flex flex-row items-center rounded-lg border p-4 space-y-0">
                          <Volume2 className="h-5 w-5 mr-4" />
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Voice</FormLabel>
                            <FormDescription className="text-xs">
                              Hang out together with voice, video and screen
                              share
                            </FormDescription>
                          </div>
                          <FormControl className="ml-auto">
                            <RadioGroupItem value={ChannelType.VOICE} />
                          </FormControl>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase">
                      Channel name
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="new-channel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className=" px-6 py-4">
              <Button disabled={isLoading}>Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelModal;
