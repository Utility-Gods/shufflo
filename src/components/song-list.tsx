import { Show } from "solid-js";
import type { FileEntry } from "../types";

interface SongListProps {
  files: () => FileEntry[] | undefined;
  nameValue: () => string;
  onSelect: (index: number) => void;
}

export function SongList(props: SongListProps) {
  return (
    <box
      title={`Songs (${props.files()?.filter((x) => x.name.includes(props.nameValue()))?.length || 0})`}
      style={{
        flexGrow: 1,
        borderStyle: "single",
        titleAlignment: "center",
      }}
    >
      <Show when={props.files()}>
        <select
          focused
          onSelect={props.onSelect}
          options={props
            .files()
            ?.filter((x) => x.name.includes(props.nameValue()))
            ?.map((ex, i) => ({
              name: ex.name,
              description: ex.fullPath,
              value: i,
            }))}
          style={{
            height: 30,
            backgroundColor: "transparent",
            focusedBackgroundColor: "transparent",
            showDescription: false,
          }}
          showScrollIndicator
          wrapSelection
          fastScrollStep={5}
        />
      </Show>
    </box>
  );
}
