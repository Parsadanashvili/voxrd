"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import type { FileWithPath } from "react-dropzone";
import { useState, useCallback, useEffect } from "react";
import { generateClientDropzoneAccept } from "uploadthing/client";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fileUploadVariants = cva("", {
  variants: {
    rounded: {
      lg: "rounded-lg",
      md: "rounded-md",
      sm: "rounded-sm",
      full: "rounded-full",
    },
  },
});

interface FileUploadProps extends VariantProps<typeof fileUploadVariants> {
  className?: string;
  label?: string;
  onChange?: (files?: File[]) => void;
  fileTypes?: string[];
  maxFiles?: number;
}

type FileType = File & {
  preview: string;
  id: string;
};

const FileUpload = ({
  className,
  label = "Drop file here",
  onChange,
  fileTypes,
  maxFiles = 1,
  rounded = "lg",
}: FileUploadProps) => {
  const [files, setFiles] = useState<FileType[]>([]);

  const getId = () => {
    return Math.random().toString(16).slice(2);
  };

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      if (acceptedFiles) {
        setFiles((prevFiles) => {
          if (prevFiles.length + acceptedFiles.length > maxFiles) {
            acceptedFiles.splice(maxFiles);
          }

          return [
            ...prevFiles,
            ...acceptedFiles.map((file) =>
              Object.assign(file, {
                id: getId(),
                preview: URL.createObjectURL(file),
              })
            ),
          ];
        });
      }
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    maxFiles,
  });

  const removeFile = (id: string) => {
    setFiles((files) => {
      return files
        .filter((item) => {
          return item.id != id;
        })
        .filter((item) => {
          URL.revokeObjectURL(item.preview);
          item.preview = URL.createObjectURL(item);

          return item;
        });
    });
  };

  useEffect(() => {
    onChange?.(files);
  }, [onChange, files]);

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  const totalFiles = files.length;

  return (
    <div
      className={cn(
        "flex items-center justify-center w-40 h-40 border border-primary/60 border-dashed cursor-pointer p-4 focus:outline focus:outline-primary/10",
        fileUploadVariants({ rounded }),
        className,
        totalFiles && "w-auto gap-4"
      )}
      {...getRootProps()}
    >
      {totalFiles < maxFiles && <input {...getInputProps()} />}
      <div
        className={cn(
          !totalFiles && "hidden",
          totalFiles && "flex items-center gap-4"
        )}
      >
        {files.map((file) => {
          return (
            <div className="relative group" key={file.id}>
              <Image
                className={cn(fileUploadVariants({ rounded }))}
                width={126}
                height={126}
                loader={(p) => p.src}
                src={file.preview}
                alt={file.name}
              />
              <div
                className={cn(
                  "absolute inset-0 flex opacity-0 invisible group-hover:opacity-100 group-hover:visible items-center justify-center group-hover:bg-background/30 transition-opacity",
                  fileUploadVariants({ rounded })
                )}
                onClick={() => {
                  removeFile(file.id);
                }}
              >
                <X />
              </div>
            </div>
          );
        })}
      </div>
      <div
        className={cn(
          totalFiles < maxFiles
            ? "flex items-center justify-center bg-primary/20 p-4 w-[126px] h-[126px]"
            : "hidden",
          fileUploadVariants({ rounded })
        )}
      >
        <div className="text-sm font-bold uppercase">{label}</div>
      </div>
    </div>
  );
};

export default FileUpload;
