import { useRenderer } from "@opentui/solid";
import { onMount, createSignal, createResource } from "solid-js";
import { green, yellow } from "@opentui/core";
import { SongList } from "./components/song-list";
import { Preview } from "./components/preview";
import { scanDir } from "./utils/files";

const MUSIC_DIR = "/media/d2du/d2du/music/songs/complete";

export const App = () => {
  const renderer = useRenderer();
  const [nameValue, setNameValue] = createSignal("");
  const [files] = createResource(MUSIC_DIR, scanDir);
  
  onMount(() => {
    renderer.useConsole = true;
    renderer.setBackgroundColor("#334455");
  });

  const handleSelect = (index: number) => {
    console.log("Selected song at index:", index);
  };

  return (
    <box
      borderColor={"green"}
      focusedBorderColor={"green"}
      title="Shufflo"
      titleAlignment="center"
      borderStyle="heavy"
    >
      <text>
        {green("Search: ")} {yellow(nameValue())}
      </text>
      <input onInput={(value) => setNameValue(value)} />

      <box style={{ flexDirection: "row", flexGrow: 1, marginTop: 1 }}>
        <box style={{ flexGrow: 1, flexShrink: 1, flexBasis: 70, marginRight: 1 }}>
          <SongList files={files} nameValue={nameValue} onSelect={handleSelect} />
        </box>
        <box style={{ flexBasis: 30, flexShrink: 0, flexGrow: 0, borderStyle: "single" }}>
          <Preview />
        </box>
      </box>
    </box>
  );
};
