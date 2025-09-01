import { useRenderer } from "@opentui/solid";
import {
  onMount,
  createSignal,
  createResource,
  Match,
  createEffect,
  Switch,
  Show,
} from "solid-js";

import { green, yellow, cyan } from "@opentui/core";

import { SongList } from "./components/song-list";
import { Preview } from "./components/preview";
import { FileSelector } from "./components/file-selector";
import Profile from "./components/profile";
import { readDirectory } from "./lib/io/files";

export const App = () => {
  const renderer = useRenderer();
  const [nameValue, setNameValue] = createSignal("");
  const [musicDirectory, setMusicDirectory] = createSignal<string | null>(null);

  const tabs = [
    { title: "Songs" },
    { title: "Choose Directory" },
    { title: "Profile" },
  ];
  onMount(() => {
    renderer.useConsole = true;
    renderer.console.show();
    renderer.setBackgroundColor("#334455");
  });

  const handleDirectorySelect = (path: string) => {
    setMusicDirectory(path);
  };

  const resetDirectory = () => {
    setMusicDirectory(null);
    setNameValue("");
  };

  const [activeTab, setActiveTab] = createSignal(0);

  return (
    <box
      borderColor={"green"}
      focusedBorderColor={"green"}
      title="Shufflo"
      titleAlignment="center"
      borderStyle="heavy"
    >
      <tab_select
        height={2}
        width="100%"
        options={tabs.map((tab, index) => ({
          name: tab.title,
          value: index,
          description: "",
        }))}
        showDescription={false}
        onChange={(index) => {
          setActiveTab(index);
        }}
        focused
      />
      <Switch>
        <Match when={activeTab() === 0}>
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
              <SongList dir={musicDirectory()} nameValue={nameValue} />
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
          <text>
            Tab 1/6 - Use Left/Right arrows to navigate | Press Ctrl+C to exit |
            D: toggle debug
          </text>
        </Match>
        <Match when={activeTab() === 1}>
          <FileSelector onDirectorySelect={handleDirectorySelect} />
          <text>
            Tab 2/6 - Use Left/Right arrows to navigate | Press Ctrl+C to exit |
            D: toggle debug
          </text>
        </Match>
        <Match when={activeTab() === 2}>
          <Profile />
          <text>
            Tab 3/6 - Use Left/Right arrows to navigate | Press Ctrl+C to exit |
            D: toggle debug
          </text>
        </Match>
      </Switch>
    </box>
  );
};
