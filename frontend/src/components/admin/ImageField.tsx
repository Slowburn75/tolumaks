"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { uploadsApi, unwrapData } from "@/lib/api";
import toast from "react-hot-toast";

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  help?: string;
}

export function ImageField({ label, value, onChange, help }: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadsApi.uploadImage(fd);
      const data = unwrapData<{ url?: string }>(res);
      const url = data?.url || (res as { url?: string }).url;
      if (!url) throw new Error("No URL returned");
      onChange(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or upload"
        />
        <label className="shrink-0">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          <Button type="button" variant="outline" disabled={uploading} asChild>
            <span className="cursor-pointer inline-flex items-center gap-1.5">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </span>
          </Button>
        </label>
      </div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      {value && (
        <div className="relative h-28 w-full max-w-xs overflow-hidden rounded-md border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}
