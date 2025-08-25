import { useRenderer, useKeyHandler } from "@opentui/solid";
import {
  createResource,
  createSignal,
  onMount,
  Show,
  onCleanup,
} from "solid-js";
import {
  RGBA,
  bold,
  t,
  fg,
  italic,
  yellow,
  cyan,
  green,
} from "@opentui/core";
import { Preview } from "./preview";
import { SongList } from "./song-list";
import path from "path";
import { scanDir } from "../utils/files";
import { MusicPlayer, type PlayerStatus } from "../utils/music-player";

const MUSIC_DIR = "/media/d2du/d2du/music/songs/complete";

const HomeScene = () => {
  const renderer = useRenderer();
  const musicPlayer = new MusicPlayer();

  const [currentSongStatus, setCurrentSongStatus] = createSignal<PlayerStatus>({
    isPlaying: false,
    currentFile: null,
    metadata: null,
    elapsedTime: 0,
  });
  const [albumArtBase64, setAlbumArtBase64] = createSignal<string | null>(null);
  const [files] = createResource(MUSIC_DIR, scanDir);

  onMount(async () => {
    renderer.useConsole = true;
    renderer.setBackgroundColor(RGBA.fromHex("#334455"));

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

  const [nameValue, setNameValue] = createSignal("");
  const [currentSongIndex, setCurrentSongIndex] = createSignal(0);

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

  async function playTrack(index: number) {
    const song = files()?.[index];
    if (!song) return;

    setCurrentSongIndex(index);

    const playPromise = musicPlayer.play(path.join(MUSIC_DIR, song));

    const status = musicPlayer.getStatus();
    setCurrentSongStatus(status);

    const base64Art = musicPlayer.getAlbumArtBase64();
    setAlbumArtBase64(base64Art);

    await playPromise;

    const finalStatus = musicPlayer.getStatus();
    setCurrentSongStatus(finalStatus);
  }

  async function handleSelect(index: number) {
    await playTrack(index);
  }

  function playNext() {
    const fileList = files()?.filter((file) => file.includes(nameValue()));
    if (!fileList || fileList.length === 0) return;

    const nextIndex = (currentSongIndex() + 1) % fileList.length;
    const nextFile = fileList[nextIndex];
    if (!nextFile) {
      return;
    }
    const originalIndex = files()?.indexOf(nextFile) ?? 0;
    playTrack(originalIndex);
  }

  function playPrevious() {
    const fileList = files()?.filter((file) => file.includes(nameValue()));
    if (!fileList || fileList.length === 0) return;

    const prevIndex =
      currentSongIndex() === 0 ? fileList.length - 1 : currentSongIndex() - 1;
    const prevFile = fileList[prevIndex];
    if (!prevFile) {
      return;
    }
    const originalIndex = files()?.indexOf(prevFile) ?? 0;
    playTrack(originalIndex);
  }
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
        <SongList files={files} nameValue={nameValue} onSelect={handleSelect} />
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
  );
};

export default HomeScene;
