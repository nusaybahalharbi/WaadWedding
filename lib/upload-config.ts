// Upload configuration
export const UPLOAD_CONFIG = {
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "50"),
  maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD || "10"),
  allowedImageTypes: [
    "image/jpeg",
    "image/png",
    "image/heic",
    "image/heif",
    "image/webp",
  ],
  allowedVideoTypes: [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/3gpp",
  ],
  get allowedTypes() {
    return [...this.allowedImageTypes, ...this.allowedVideoTypes];
  },
  get maxFileSizeBytes() {
    return this.maxFileSizeMB * 1024 * 1024;
  },
};

export function isAllowedFileType(mimeType: string): boolean {
  return UPLOAD_CONFIG.allowedTypes.includes(mimeType);
}

export function isFileTooLarge(sizeBytes: number): boolean {
  return sizeBytes > UPLOAD_CONFIG.maxFileSizeBytes;
}
