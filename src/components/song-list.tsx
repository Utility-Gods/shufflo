import { createEffect, createResource, Show } from "solid-js";
import { readDirectory } from "../lib/io/files";

interface SongListProps {
  dir: string;
  nameValue: () => string;
}

export function SongList(props: SongListProps) {
  const dir = props.dir;

  const [files] = createResource(dir, readDirectory);
  createEffect(() => {
    console.log("Effect running...", files());
  }, files);

  function onSelect(index: number) {
    console.log("Selected song at index:", index);
  }
  return (
    <box
      title={`Songs (${files()?.filter((x) => x.name.includes(props.nameValue()))?.length || 0})`}
      style={{
        flexGrow: 1,
        borderStyle: "single",
        titleAlignment: "center",
      }}
    >
      <Show when={files()}>
        <select
          focused
          onSelect={onSelect}
          options={files()
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
