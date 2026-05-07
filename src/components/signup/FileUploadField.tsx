import { useRef, useState } from "react";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FileUploadFieldProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFiles: (files: File[]) => void;
  files: File[];
}

const FileUploadField = ({
  label,
  accept = "image/*",
  multiple = false,
  maxSizeMB = 5,
  onFiles,
  files,
}: FileUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    const valid = arr.filter((f) => {
      if (f.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${f.name} exceeds ${maxSizeMB}MB`);
        return false;
      }
      return true;
    });
    onFiles(multiple ? [...files, ...valid] : valid.slice(0, 1));
  };

  const remove = (idx: number) => {
    const next = files.slice();
    next.splice(idx, 1);
    onFiles(next);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-body text-muted-foreground">{label}</Label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`glass-card p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
          drag ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
        }`}
      >
        <Upload className="w-5 h-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-body text-center">
          Click or drag to upload {label.toLowerCase()} (max {maxSizeMB}MB)
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <span className="text-xs font-body truncate">{f.name}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadField;
