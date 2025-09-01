import { createEffect, Show } from "solid-js";

interface SongListProps {
  dir: string | null;
  nameValue: () => string;
  onSelect: (index: number) => void;
  files: () => string[] | undefined;
}

export function SongList(props: SongListProps) {
  createEffect(() => {
    console.log("Music files:", props.files());
  });

  const filteredFiles = () => {
    const allFiles = props.files() || [];
    const nameFilter = props.nameValue();
    return nameFilter
      ? allFiles.filter((file) =>
          file.toLowerCase().includes(nameFilter.toLowerCase()),
        )
      : allFiles;
  };

  const handleSelect = (index: number) => {
    const filtered = filteredFiles();
    const selectedFile = filtered[index];
    if (!selectedFile) return;

    // Find the original index in the unfiltered list
    const originalIndex = props.files()?.indexOf(selectedFile) ?? -1;
    if (originalIndex !== -1) {
      props.onSelect(originalIndex);
    }
  };
  return (
    <box
      title={`Songs (${filteredFiles().length})`}
      style={{
        flexGrow: 1,
        borderStyle: "single",
        titleAlignment: "center",
      }}
    >
      <Show when={props.dir && props.files() && filteredFiles().length > 0}>
        <select
          focused
          onSelect={handleSelect}
          options={filteredFiles().map((file, i) => ({
            name: file,
            description: props.dir ? `${props.dir}/${file}` : file,
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
