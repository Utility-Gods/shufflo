import { $ } from "bun";
import type { Subprocess } from "bun";

interface PlaybackOptions {
  volume?: number; // 0-100
  startTime?: number; // seconds
}

interface MusicPlayerStatus {
  isPlaying: boolean;
  currentFile: string | null;
}
class MusicPlayer {
  private currentProcess: Subprocess | null = null;
  private isPlaying: boolean = false;
  private currentFile: string | null = null;
  private platform: NodeJS.Platform = process.platform;

  async play(filePath: string, options?: PlaybackOptions): Promise<void> {
    // Stop current song if playing
    if (this.currentProcess) {
      await this.stop();
    }

    this.currentFile = filePath;

    try {
      this.currentProcess = await this.getPlayerCommand(filePath, options);
      this.isPlaying = true;
      this.isPlaying = false;
      this.currentFile = null;
    } catch (error) {
      console.error("Error playing audio:", error);
      this.isPlaying = false;
      this.currentFile = null;
      throw error;
    }
  }

  private async getPlayerCommand(
    filePath: string,
    options?: PlaybackOptions,
  ): Promise<Subprocess> {
    const volume = options?.volume ?? 100;
    const startTime = options?.startTime ?? 0;

    switch (this.platform) {
      case "darwin":
        // macOS - use afplay
        const macArgs = [];
        if (volume !== 100) {
          macArgs.push("-v", String(volume / 100));
        }
        if (startTime > 0) {
          macArgs.push("-t", String(startTime));
        }
        return $`afplay ${macArgs} ${filePath}`.quiet();

      case "linux":
        // Linux - try mpg123, then ffplay
        try {
          const mpgArgs = [];
          if (volume !== 100) {
            mpgArgs.push("-f", String(Math.floor((32768 * volume) / 100)));
          }
          if (startTime > 0) {
            mpgArgs.push("-k", String(Math.floor(startTime * 38.28)));
          }
          return await $`mpg123 ${mpgArgs} ${filePath}`.quiet();
        } catch {
          const ffplayArgs = ["-nodisp", "-autoexit"];
          if (volume !== 100) {
            ffplayArgs.push("-volume", String(volume));
          }
          if (startTime > 0) {
            ffplayArgs.push("-ss", String(startTime));
          }
          return $`ffplay ${ffplayArgs} ${filePath}`.quiet();
        }

      case "win32":
        // Windows - use powershell
        return $`powershell -c (New-Object Media.SoundPlayer "${filePath}").PlaySync()`.quiet();

      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  async stop(): Promise<void> {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
      this.isPlaying = false;
      this.currentFile = null;
    }
  }

  async pause(): Promise<void> {
    if (this.currentProcess && this.isPlaying) {
      this.currentProcess.kill("SIGSTOP");
      this.isPlaying = false;
    }
  }

  async resume(): Promise<void> {
    if (this.currentProcess && !this.isPlaying) {
      this.currentProcess.kill("SIGCONT");
      this.isPlaying = true;
    }
  }

  getStatus(): MusicPlayerStatus {
    return {
      isPlaying: this.isPlaying,
      currentFile: this.currentFile,
    };
  }
}

export { MusicPlayer, type PlaybackOptions, type MusicPlayerStatus };
