import { createSignal, createResource, Show } from "solid-js";
import { green, yellow, cyan } from "@opentui/core";
import path from "path";
import { readDirectory } from "../lib/io/files";
import type { FileSelectorProps } from "../lib/types";

export function FileSelector(props: FileSelectorProps) {
  const [currentPath, setCurrentPath] = createSignal(
    process.env.HOME || "/home",
  );
  const [files] = createResource(currentPath, (path) => readDirectory(path));
  const handleSelect = (index: number) => {
    const fileList = files();
    if (!fileList || !fileList[index]) return;

    const selected = fileList[index];

    if (selected.isDirectory) {
      setCurrentPath(selected.fullPath);
    } else {
      props.onDirectorySelect(path.dirname(selected.fullPath));
    }
  };

  const goUp = () => {
    const parent = path.dirname(currentPath());
    if (parent !== currentPath()) {
      setCurrentPath(parent);
    }
  };

  const goBack = () => {
    const parent = path.dirname(currentPath());
    if (parent !== currentPath()) {
      setCurrentPath(parent);
    }
  };
  const selectCurrentDirectory = () => {
    props.onDirectorySelect(currentPath());
  };

  return (
    <box
      title="Select Music Directory"
      titleAlignment="center"
      borderStyle="heavy"
      borderColor="cyan"
      style={{ flexGrow: 1 }}
    >
      <text>
        {cyan("Current: ")} {currentPath()}
      </text>

      <box style={{ flexDirection: "row", marginTop: 1, marginBottom: 1 }}>
        <text onMouseDown={goUp} style={{ marginRight: 2 }}>
          {yellow("← Parent")}
        </text>
        <text onMouseDown={selectCurrentDirectory}>
          {green("✓ Select This Directory")}
        </text>
      </box>

      <Show when={files()}>
        <select
          focused
          onSelect={handleSelect}
          options={
            files()?.map((entry, i) => ({
              name: `${entry.isDirectory ? "📁" : "📄"} ${entry.name}`,
              description: entry.isDirectory ? "Directory" : "File",
              value: i,
            })) || []
          }
          style={{
            height: 25,
            backgroundColor: "transparent",
            focusedBackgroundColor: "transparent",
            showDescription: true,
          }}
          showScrollIndicator
          wrapSelection
          fastScrollStep={5}
        />
      </Show>
    </box>
  );
}
