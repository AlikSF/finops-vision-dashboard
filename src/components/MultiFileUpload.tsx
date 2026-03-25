import { useCallback, useRef } from "react";
import { Upload, CheckCircle, X, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FileType } from "@/data/dataModels";
import { FILE_TYPE_LABELS, FILE_TYPE_REQUIRED } from "@/data/dataModels";

interface MultiFileUploadProps {
  uploadedFiles: Record<FileType, { name: string; count: number; timestamp: string } | null>;
  onUpload: (file: File, fileType?: FileType) => void;
  onClearAll: () => void;
  isProcessing: boolean;
}

const FILE_TYPES: FileType[] = ["users_master", "login_history", "user_license_pool", "psl_pool", "psl_assignments"];

export function MultiFileUpload({ uploadedFiles, onUpload, onClearAll, isProcessing }: MultiFileUploadProps) {
  return (
    <div className="space-y-2">
      {FILE_TYPES.map((ft) => (
        <FileSlot key={ft} fileType={ft} info={uploadedFiles[ft]} onUpload={onUpload} isProcessing={isProcessing} />
      ))}
      <div className="flex gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 h-7 px-2">
          <X className="h-3 w-3 mr-1" /> Clear All
        </Button>
      </div>
    </div>
  );
}

function FileSlot({
  fileType, info, onUpload, isProcessing,
}: {
  fileType: FileType;
  info: { name: string; count: number; timestamp: string } | null;
  onUpload: (file: File, fileType?: FileType) => void;
  isProcessing: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const required = FILE_TYPE_REQUIRED[fileType];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file, fileType);
  }, [fileType, onUpload]);

  const handleClick = () => inputRef.current?.click();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file, fileType);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-xs
        ${info ? "bg-primary-foreground/15" : "bg-primary-foreground/5 hover:bg-primary-foreground/10"}
        border border-primary-foreground/10
      `}
    >
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
      {isProcessing ? (
        <Loader2 className="h-3.5 w-3.5 text-primary-foreground/60 animate-spin shrink-0" />
      ) : info ? (
        <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
      ) : (
        <FileSpreadsheet className="h-3.5 w-3.5 text-primary-foreground/40 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-primary-foreground/90 truncate font-medium">
          {FILE_TYPE_LABELS[fileType]}
          {required && !info && <span className="text-red-400 ml-1">*</span>}
        </div>
        {info && (
          <div className="text-primary-foreground/50 text-[10px] truncate">
            {info.count} records • {info.name}
          </div>
        )}
      </div>
    </div>
  );
}
