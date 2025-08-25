import { $ } from "bun";
import type { Subprocess } from "bun";
import * as mm from "music-metadata";
import type { IAudioMetadata, IPicture } from "music-metadata";
import path from "path";

interface SongMetadata {
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

interface AlbumArt {
  format: string; // 'image/jpeg', 'image/png', etc.
  data: Buffer;
  description?: string;
}

interface PlayerStatus {
  isPlaying: boolean;
  currentFile: string | null;
  metadata: SongMetadata | null;
  startTime?: Date;
  elapsedTime?: number; // in seconds
}

class MusicPlayer {
  private currentProcess: Subprocess | null = null;
  private isPlaying: boolean = false;
  private currentFile: string | null = null;
  private currentMetadata: SongMetadata | null = null;
  private startTime: Date | null = null;
  private platform: NodeJS.Platform = process.platform;

  async play(filePath: string): Promise<void> {
    // Stop current song if playing
    await this.stop();

    this.currentFile = filePath;

    try {
      this.currentMetadata = await this.extractMetadata(filePath);
    } catch (error) {
      console.error("Error extracting metadata:", error);
      this.currentMetadata = null;
    }

    try {
      this.currentProcess = this.getPlayerCommand(filePath);
      this.isPlaying = true;
      this.startTime = new Date();

      this.currentProcess.exited
        .then(() => {
          if (this.isPlaying) {
            this.isPlaying = false;
            this.currentFile = null;
            this.currentMetadata = null;
            this.startTime = null;
            this.currentProcess = null;
            this.currentPid = null;
          }
        })
        .catch(() => {
          // Process was killed or errored - already handled by stop()
        });
    } catch (error) {
      console.error("Error starting audio:", error);
      this.isPlaying = false;
      this.currentFile = null;
      this.currentMetadata = null;
      this.startTime = null;
      throw error;
    }
  }

  private async extractMetadata(filePath: string): Promise<SongMetadata> {
    try {
      const metadata: IAudioMetadata = await mm.parseFile(filePath);

      let albumArt: AlbumArt | undefined;
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const picture: IPicture | undefined = metadata.common.picture[0];
        albumArt = {
          format: picture?.format ?? "",
          data: Buffer.from(picture?.data ?? []),
          description: picture?.description ?? "",
        };
      }

      return {
        title: metadata.common.title,
        artist: metadata.common.artist,
        album: metadata.common.album,
        albumArtist: metadata.common.albumartist,
        year: metadata.common.year,
        genre: metadata.common.genre,
        duration: metadata.format.duration,
        bitrate: metadata.format.bitrate,
        sampleRate: metadata.format.sampleRate,
        trackNumber: metadata.common.track?.no ?? 0,
        diskNumber: metadata.common.disk?.no ?? 0,
        comment: metadata.common.comment ?? [],
        albumArt,
      };
    } catch (error) {
      console.error("Failed to sarse metadata:", error);
      return {};
    }
  }

  private formatDuration(seconds?: number): string {
    if (!seconds) return "Unknown";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  private getPlayerCommand(filePath: string): Subprocess {
    console.log(`🎵 Starting player for: ${filePath}`);
    switch (this.platform) {
      case "darwin":
        return Bun.spawn(["afplay", filePath], {
          stdout: "ignore",
          stderr: "ignore",
        });
      case "linux":
        console.log("Using ffplay for Linux...");
        return Bun.spawn(["ffplay", "-nodisp", "-autoexit", filePath], {
          stdout: "ignore",
          stderr: "ignore",
        });
      case "win32":
        return Bun.spawn(
          [
            "powershell",
            "-c",
            `(New-Object Media.SoundPlayer "${filePath}").PlaySync()`,
          ],
          {
            stdout: "ignore",
            stderr: "ignore",
          },
        );
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  async stop(): Promise<void> {
    // Kill stored process if it exists
    if (this.currentProcess) {
      try {
        this.currentProcess.kill();
      } catch (error) {
        console.log("Error killing stored process:", error);
      }
      this.currentProcess = null;
    }

    try {
      switch (this.platform) {
        case "darwin":
          await $`pkill -9 afplay`.catch(() => {});
          break;
        case "linux":
          await $`pkill -9 ffplay 2>/dev/null`.catch(() => {});
          await $`killall -9 ffplay 2>/dev/null`.catch(() => {});
          break;
        case "win32":
          await $`taskkill /f /im powershell.exe`.catch(() => {});
          break;
      }
    } catch (error) {
      // Ignore errors - processes might not exist
    }

    this.isPlaying = false;
    this.currentFile = null;
    this.currentMetadata = null;
    this.startTime = null;
  }

  getStatus(): PlayerStatus {
    let elapsedTime: number | undefined;

    if (this.startTime && this.isPlaying) {
      elapsedTime = (Date.now() - this.startTime.getTime()) / 1000;
    }

    return {
      isPlaying: this.isPlaying,
      currentFile: this.currentFile,
      metadata: this.currentMetadata,
      startTime: this.startTime || undefined,
      elapsedTime,
    };
  }

  getNowPlaying(): string {
    const status = this.getStatus();

    if (!status.isPlaying || !status.metadata) {
      return "Nothing playing";
    }

    const { metadata, elapsedTime } = status;
    const elapsed = this.formatDuration(elapsedTime);
    const total = this.formatDuration(metadata.duration);

    return `${metadata.artist || "Unknown"} - ${metadata.title || "Unknown"} [${elapsed}/${total}]`;
  }

  getMetadata(): SongMetadata | null {
    return this.currentMetadata;
  }

  getAlbumArtBase64(): string | null {
    if (!this.currentMetadata?.albumArt) {
      return null;
    }

    const { format, data } = this.currentMetadata.albumArt;
    return `data:${format};base64,${data.toString("base64")}`;
  }

  pause(): void {
    if (this.isPlaying && this.currentProcess) {
      this.currentProcess.kill();
      this.isPlaying = false;
    }
  }

  togglePlayPause(): void {
    if (this.isPlaying) {
      this.stop();
    }
  }
}

export { MusicPlayer, type SongMetadata, type PlayerStatus, type AlbumArt };
