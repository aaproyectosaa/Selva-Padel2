"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { UploadCloud, X } from "lucide-react";

interface CloudinaryUploadProps {
  onUploadComplete: (url: string) => void;
  value?: string;
}

export function CloudinaryUpload({ onUploadComplete, value }: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await response.json();
      onUploadComplete(data.url);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary"}
          ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt="Preview"
              className="max-h-32 mx-auto rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onUploadComplete("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">
              {isDragActive
                ? "Suelta la imagen aquí"
                : "Arrastra una imagen o haz clic para seleccionar"}
            </p>
          </div>
        )}
      </div>
      {isUploading && (
        <div className="text-sm text-gray-500 text-center">
          Subiendo imagen...
        </div>
      )}
    </div>
  );
} 