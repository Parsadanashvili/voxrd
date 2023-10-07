"use client";

import axios from "@/lib/axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import FileUpload from "../FileUpload";
import { useUploadThing } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import useModal, { ModalType } from "@/hooks/useModalStore";

const formSchema = z.object({
  fileUrl: z.array(z.any()).max(1, {
    message: "Attachment is required",
  }),
});

export const MessageFileModal = () => {
  const router = useRouter();

  const { isOpen, onClose, type, data } = useModal();

  const { apiUrl } = data;

  const isModalOpen = isOpen && type === "messageFile";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fileUrl: [],
    },
  });

  const isLoading = form.formState.isSubmitting;

  const { startUpload } = useUploadThing("messageFile");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!apiUrl) return;

    try {
      const uploadRes = await startUpload(values.fileUrl);

      if (uploadRes?.[0].url) {
        const res = await axios.post(apiUrl, {
          fileUrl: uploadRes?.[0].url,
          content: uploadRes?.[0].url,
        });

        handleClose();
      }
    } catch (e) {}
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Add an attachment
          </DialogTitle>

          <DialogDescription className="text-center">
            Send a file as a message
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <div className="flex items-center justify-center text-center">
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          label="Upload"
                          maxFiles={1}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className=" px-6 py-4">
              <Button disabled={isLoading}>Send</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
