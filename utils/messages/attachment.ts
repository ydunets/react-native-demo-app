const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;

export const formatFileSize = (bytes: number): string => {
  if (bytes < BYTES_PER_KB) return `${bytes} B`;
  if (bytes < BYTES_PER_MB) return `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
  return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
};

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const getIconNameFromExtension = (extension: string): string => {
  switch (extension) {
    case 'pdf':
      return 'doc.fill';
    case 'docx':
    case 'doc':
      return 'doc.fill';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return 'photo.fill';
    case 'mp4':
    case 'mov':
    case 'avi':
      return 'play.circle.fill';
    default:
      return 'doc.fill';
  }
};
