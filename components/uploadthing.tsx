"use client";

import { useState, useCallback } from "react";
import { generateClientDropzoneAccept } from "uploadthing/client";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, Image } from "lucide-react";

interface UploadThingProps {
  onUploadComplete: (url: string) => void;
  value?: string;
}

export function UploadThingImage({ onUploadComplete, value }: UploadThingProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);
      setError(null);

      try {
        const file = acceptedFiles[0];
        
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        
        // Crear URL de vista previa temporal
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // Subir a UploadThing
        const res = await fetch("/api/uploadthing", {
          method: "POST",
          headers: {
            "X-uploadthing-action": "upload",
          },
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Error al subir la imagen");
        }

        const data = await res.json();
        const imageUrl = data.data[0].url;
        
        setIsUploading(false);
        onUploadComplete(imageUrl);
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || "Error al subir la imagen");
        setIsUploading(false);
      }
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(["image/*"]),
    maxFiles: 1,
    multiple: false,
  });

  const removeImage = () => {
    setPreview(null);
    onUploadComplete("");
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative w-full h-40 mb-2 border rounded-md overflow-hidden">
          <img 
            src={preview} 
            alt="Vista previa" 
            className="w-full h-full object-cover" 
          />
          <button 
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-500"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-2 bg-green-50 rounded-full">
              <UploadCloud className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Suelta la imagen aquí...</p>
              ) : (
                <p>Arrastra una imagen aquí, o haz clic para seleccionar</p>
              )}
            </div>
            <p className="text-xs text-gray-400">PNG, JPG o WEBP (máx. 4MB)</p>
          </div>
        </div>
      )}
      
      {isUploading && (
        <div className="mt-2 text-sm text-blue-600">
          Subiendo imagen...
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
} 