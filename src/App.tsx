import { useRenderer, useKeyHandler } from "@opentui/solid";
import {
  onMount,
  createSignal,
  createResource,
  Match,
  Switch,
  onCleanup,
} from "solid-js";

import { green, yellow, cyan } from "@opentui/core";

import { SongList } from "./components/song-list";
import { Preview } from "./components/preview";
import { FileSelector } from "./components/file-selector";
import Profile from "./components/profile";
import { scanDir } from "./lib/io/files";
import { MusicPlayer } from "./lib/player/music-player";
import type { PlayerStatus } from "./lib/types";
import path from "path";

export const App = () => {
  const renderer = useRenderer();
  const musicPlayer = new MusicPlayer();
  const [nameValue, setNameValue] = createSignal("");
  const [musicDirectory, setMusicDirectory] = createSignal<string | null>(
    "/media/d2du/d2du/music/Songs/complete",
  );
  const [currentSongStatus, setCurrentSongStatus] = createSignal<PlayerStatus>({
    isPlaying: false,
    currentFile: null,
    metadata: null,
    elapsedTime: 0,
  });
  const [albumArtBase64, setAlbumArtBase64] = createSignal<string | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = createSignal(0);
  const [allMusicFiles] = createResource(musicDirectory, (dir) =>
    dir ? scanDir(dir) : Promise.resolve([]),
  );

  const tabs = [
    { title: "Songs" },
    { title: "Choose Directory" },
    { title: "Profile" },
  ];
  onMount(async () => {
    renderer.useConsole = true;
    renderer.console.show();
    renderer.setBackgroundColor("#334455");

    const cleanup = async () => {
      console.log("Cleaning up music processes...");
      await musicPlayer.stop();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("exit", cleanup);
  });

  onCleanup(async () => {
    await musicPlayer.stop();
  });

  // Add keyboard handlers
  useKeyHandler((key) => {
    switch (key.name) {
      case "t":
        renderer.console.toggle();
        break;
      case "p":
        playPrevious();
        break;
      case "n":
        playNext();
        break;
      case " ":
      case "space":
        musicPlayer.togglePlayPause();
        setCurrentSongStatus(musicPlayer.getStatus());
        break;
    }

    switch (key.raw) {
      case "\u0003":
        renderer.stop();
        process.exit(0);
      case " ":
        musicPlayer.togglePlayPause();
        setCurrentSongStatus(musicPlayer.getStatus());
        break;
    }
  });

  const handleDirectorySelect = (path: string) => {
    setMusicDirectory(path);
    // Auto switch to Songs tab after selecting directory
    setActiveTab(0);
  };

  const resetDirectory = () => {
    setMusicDirectory(null);
    setNameValue("");
  };

  async function playTrack(index: number) {
    const song = allMusicFiles()?.[index];
    if (!song || !musicDirectory()) return;

    setCurrentSongIndex(index);

    const playPromise = musicPlayer.play(path.join(musicDirectory()!, song));

    const status = musicPlayer.getStatus();
    setCurrentSongStatus(status);

    const base64Art = musicPlayer.getAlbumArtBase64();
    setAlbumArtBase64(base64Art);

    await playPromise;

    const finalStatus = musicPlayer.getStatus();
    setCurrentSongStatus(finalStatus);
  }

  async function handleSongSelect(index: number) {
    await playTrack(index);
  }

  function playNext() {
    const fileList = allMusicFiles()?.filter((file) =>
      file.includes(nameValue()),
    );
    if (!fileList || fileList.length === 0) return;

    const nextIndex = (currentSongIndex() + 1) % fileList.length;
    const nextFile = fileList[nextIndex];
    if (!nextFile) {
      return;
    }
    const originalIndex = allMusicFiles()?.indexOf(nextFile) ?? 0;
    playTrack(originalIndex);
  }

  function playPrevious() {
    const fileList = allMusicFiles()?.filter((file) =>
      file.includes(nameValue()),
    );
    if (!fileList || fileList.length === 0) return;

    const prevIndex =
      currentSongIndex() === 0 ? fileList.length - 1 : currentSongIndex() - 1;
    const prevFile = fileList[prevIndex];
    if (!prevFile) {
      return;
    }
    const originalIndex = allMusicFiles()?.indexOf(prevFile) ?? 0;
    playTrack(originalIndex);
  }

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
              <SongList
                dir={musicDirectory()}
                nameValue={nameValue}
                onSelect={handleSongSelect}
                files={allMusicFiles}
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
              <Preview
                currentSongStatus={currentSongStatus}
                onPlayPause={() => {
                  musicPlayer.togglePlayPause();
                  setCurrentSongStatus(musicPlayer.getStatus());
                }}
                onNext={playNext}
                onPrevious={playPrevious}
                albumArtBase64={albumArtBase64()}
              />
            </box>
          </box>
          <text>
            Tab 1/6 - Use Left/Right arrows to navigate | Press Ctrl+C to exit |
            D: toggle debug
          </text>
        </Match>
        <Match when={activeTab() === 1}>
          <FileSelector
            onDirectorySelect={handleDirectorySelect}
            currentPath={() => musicDirectory() || "/media/d2du/d2du/music/Songs/complete"}
            setCurrentPath={setMusicDirectory}
          />
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
