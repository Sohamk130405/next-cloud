import { File, FileArchive, FileAudio, FileImage, FileText, FileVideo } from "lucide-react";

export type FileKind = "image" | "video" | "audio" | "document" | "archive" | "file";

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
  xml: "application/xml",
  csv: "text/csv",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  mp4: "video/mp4",
  webm: "video/webm",
  avi: "video/x-msvideo",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
};

export function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return MIME_TYPES_BY_EXTENSION[extension] || "application/octet-stream";
}

export function getEffectiveMimeType(mimeType: string | null | undefined, fileName: string): string {
  if (!mimeType || mimeType === "application/octet-stream" || mimeType === "application/x-octet-stream") {
    return getMimeTypeFromFileName(fileName);
  }

  return mimeType;
}

export function getFileKind(mimeType: string | null | undefined, fileName = ""): FileKind {
  const effectiveMimeType = getEffectiveMimeType(mimeType, fileName);

  if (effectiveMimeType.startsWith("image/")) return "image";
  if (effectiveMimeType.startsWith("video/")) return "video";
  if (effectiveMimeType.startsWith("audio/")) return "audio";
  if (
    effectiveMimeType.includes("pdf") ||
    effectiveMimeType.includes("document") ||
    effectiveMimeType.includes("spreadsheet") ||
    effectiveMimeType.includes("presentation") ||
    effectiveMimeType.startsWith("text/") ||
    effectiveMimeType === "application/json"
  ) {
    return "document";
  }
  if (effectiveMimeType.includes("zip") || effectiveMimeType.includes("rar") || effectiveMimeType.includes("compressed")) {
    return "archive";
  }

  return "file";
}

export function getFileIcon(fileKind: FileKind) {
  const className = "h-5 w-5";

  if (fileKind === "image") return FileImage;
  if (fileKind === "video") return FileVideo;
  if (fileKind === "audio") return FileAudio;
  if (fileKind === "document") return FileText;
  if (fileKind === "archive") return FileArchive;

  return File;
}

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${Number(value.toFixed(value >= 10 || index === 0 ? 0 : 1))} ${units[index]}`;
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "No date";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
