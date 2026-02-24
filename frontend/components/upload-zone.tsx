"use client"

import { useState, useCallback, useRef } from "react"
import { CloudUpload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadZoneProps {
  onUploadSuccess: () => void;
}

export function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // THE API CALL TO YOUR BACKEND
  const uploadFile = async (file: File) => {
    setIsUploading(true)
    
    try {
      // Get the token from local storage
      const token = localStorage.getItem("token");
      
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5000/api/docs/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      // Success! Tell the parent page to refresh the document list
      onUploadSuccess();
      
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload document. Make sure you are logged in!");
    } finally {
      setIsUploading(false);
      // Reset the file input so you can upload the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (isUploading) return;

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type === "application/pdf") {
      uploadFile(files[0])
    } else {
      alert("Please upload a PDF file.");
    }
  }, [isUploading])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleClick = () => {
    if (!isUploading) fileInputRef.current?.click()
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed 
        px-8 py-16 transition-all duration-300 cursor-pointer
        bg-card/80 backdrop-blur-sm
        ${
          isDragging
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.01]"
            : "border-border hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-md"
        }
        ${isUploading ? "opacity-70 pointer-events-none" : ""}
      `}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 ${isDragging ? "scale-110 bg-primary/20" : ""}`}>
        {isUploading ? (
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        ) : (
          <CloudUpload className={`h-10 w-10 text-primary transition-all duration-300 ${isDragging ? "scale-110" : ""}`} />
        )}
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {isUploading ? "Uploading to Cloud..." : "Drag & Drop your PDF here"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isUploading ? "Please wait a moment" : "or click anywhere to browse your files"}
        </p>
      </div>

      <Button size="lg" className="mt-2 rounded-xl px-8 text-base font-medium" disabled={isUploading}>
        {isUploading ? "Uploading..." : "Select Document"}
      </Button>
    </div>
  )
}