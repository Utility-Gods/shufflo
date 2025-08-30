import { useRenderer } from "@opentui/solid";
import { onMount, createSignal, createResource, Show } from "solid-js";
import { green, yellow, cyan } from "@opentui/core";
import { SongList } from "./components/song-list";
import { Preview } from "./components/preview";
import { FileSelector } from "./components/file-selector";
import { readDirectory } from "./files";
import { Console, Effect, pipe } from "effect";

export const App = () => {
  const renderer = useRenderer();
  const [nameValue, setNameValue] = createSignal("");
  const [musicDirectory, setMusicDirectory] = createSignal<string | null>(null);

  const [files] = createResource(musicDirectory, (path) =>
    Effect.runPromise(
      pipe(readDirectory(path), Effect.tapError(Console.error)),
    ).catch((e) => {
      console.error("Error reading directory:", e);
    }),
  );

  onMount(() => {
    renderer.useConsole = true;
    renderer.console.show();
    renderer.setBackgroundColor("#334455");
  });

  const handleDirectorySelect = (path: string) => {
    setMusicDirectory(path);
  };

  const handleSongSelect = (index: number) => {
    console.log("Selected song at index:", index);
  };

  const resetDirectory = () => {
    setMusicDirectory(null);
    setNameValue("");
  };

  return (
    <box
      borderColor={"green"}
      focusedBorderColor={"green"}
      title="Shufflo"
      titleAlignment="center"
      borderStyle="heavy"
    >
      <Show
        when={musicDirectory()}
        fallback={<FileSelector onDirectorySelect={handleDirectorySelect} />}
      >
        <box style={{ flexDirection: "row", marginBottom: 1 }}>
          <text>
            {cyan("Directory: ")} {musicDirectory()}
          </text>
          <text onMouseDown={resetDirectory} style={{ marginLeft: 2 }}>
            {yellow("← Change Directory")}
          </text>
        </box>

        <text>
          {green("Search: ")} {yellow(nameValue())}
        </text>
        <input onInput={(value) => setNameValue(value)} />

        <box style={{ flexDirection: "row", flexGrow: 1, marginTop: 1 }}>
          <box
            style={{
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: 70,
              marginRight: 1,
            }}
          >
            <SongList
              files={files}
              nameValue={nameValue}
              onSelect={handleSongSelect}
            />
          </box>
          <box
            style={{
              flexBasis: 30,
              flexShrink: 0,
              flexGrow: 0,
              borderStyle: "single",
            }}
          >
            <Preview />
          </box>
        </box>
      </Show>
    </box>
  );
};
