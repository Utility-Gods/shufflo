import { t, bold, italic, green, yellow, cyan, white } from "@opentui/core";
import type { PlayerStatus } from "../utils/music-player";

interface PreviewProps {
  currentSongStatus: () => PlayerStatus;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function Preview(props: PreviewProps) {
  return (
    <box
      style={{
        position: "absolute",
        right: 2,
        top: 1,
        width: 28,
        height: 30,
        borderStyle: "single",
      }}
    >
      <box
        style={{
          width: 20,
          height: 18,
          marginTop: 1,
          left: 2,
        }}
      />
      <text>{green(bold("▶ Now Playing"))}</text>

      <text>
        {bold(yellow(props.currentSongStatus().metadata?.title?.substring(0, 22) || "No song selected"))}
      </text>

      <text>
        {italic(green(props.currentSongStatus().metadata?.artist?.substring(0, 22) || ""))}
      </text>

      <text>
        {yellow(
          props.currentSongStatus().metadata?.album?.substring(0, 22) || "",
        )}
      </text>

      <text>
        {cyan(
          `${props.currentSongStatus().metadata?.year || ""}${props.currentSongStatus().metadata?.duration ? ` • ${Math.floor(props.currentSongStatus().metadata.duration / 60)}:${String(Math.floor(props.currentSongStatus().metadata.duration % 60)).padStart(2, "0")}` : ""}`
        )}
      </text>

      <text>
        {props.currentSongStatus().elapsedTime !== undefined ? 
          white(`${Math.floor(props.currentSongStatus().elapsedTime! / 60)}:${String(Math.floor(props.currentSongStatus().elapsedTime! % 60)).padStart(2, "0")}`) : ""
        }
      </text>

      <box
        style={{
          flexDirection: "row",
          marginTop: 1,
          justifyContent: "center",
        }}
      >
        <box
          style={{
            width: 4,
            height: 2,
            borderStyle: "single",
            marginRight: 1,
          }}
          onMouseDown={props.onPrevious}
        >
          <text>{white("⏮")}</text>
        </box>

        <box
          style={{
            width: 4,
            height: 2,
            borderStyle: "single",
          }}
          onMouseDown={props.onPlayPause}
        >
          <text>
            {white(props.currentSongStatus().isPlaying ? "⏸" : "▶")}
          </text>
        </box>

        <box
          style={{
            width: 4,
            height: 2,
            borderStyle: "single",
          }}
          onMouseDown={props.onNext}
        >
          <text>{white("⏭")}</text>
        </box>
      </box>
    </box>
  );
}

