export interface FileEntry {
  name: string;
  fullPath: string;
  isDirectory: boolean;
}

export interface FileSelectorProps {
  onDirectorySelect: (path: string) => void;
  currentPath: () => string;
  setCurrentPath: (path: string) => void;
}

export interface SongMetadata {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  year?: number;
  genre?: string[];
  duration?: number; // in seconds
  bitrate?: number;
  sampleRate?: number;
  trackNumber?: number;
  diskNumber?: number;
  comment?: string[];
  albumArt?: AlbumArt;
}

export interface AlbumArt {
  format: string; // 'image/jpeg', 'image/png', etc.
  data: Buffer;
  description?: string;
}

export interface PlayerStatus {
  isPlaying: boolean;
  currentFile: string | null;
  metadata: SongMetadata | null;
  startTime?: Date;
  elapsedTime?: number; // in seconds
}
