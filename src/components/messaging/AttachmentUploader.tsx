import { useState, useRef } from "react";
import { Paperclip, X, Image as ImageIcon, File as FileIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadAttachment } from "@/lib/messaging";
import { toast } from "sonner";

interface AttachmentUploaderProps {
  onUploadComplete: (attachment: { url: string; type: 'image' | 'file'; name: string }) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export const AttachmentUploader = ({ onUploadComplete, onUploadingChange }: AttachmentUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Constraints: 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);

    try {
      const attachment = await uploadAttachment(file);
      onUploadComplete(attachment as { url: string; type: 'image' | 'file'; name: string });
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button
        variant="ghost"
        size="icon"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
      </Button>
    </div>
  );
};
