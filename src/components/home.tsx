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
  FrameBufferRenderable,
} from "@opentui/core";
import { ThreeCliRenderer } from "@opentui/core/3d";
import * as THREE from "three";
import {
  DataTexture,
  RGBAFormat,
  UnsignedByteType,
  ClampToEdgeWrapping,
  NearestFilter,
  SpriteMaterial,
  Sprite,
} from "three";
import { Jimp } from "jimp";
import path from "path";
import { scanDir } from "../utils/files";
import { MusicPlayer, type PlayerStatus } from "../utils/music-player";

const MUSIC_DIR = "/media/d2du/d2du/music/songs/complete";

async function createSpriteFromBase64(
  base64Data: string,
): Promise<Sprite | null> {
  try {
    const base64 = base64Data.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    const image = await Jimp.read(buffer);
    image.flip({ horizontal: false, vertical: true });

    const texture = new DataTexture(
      image.bitmap.data,
      image.bitmap.width,
      image.bitmap.height,
      RGBAFormat,
      UnsignedByteType,
    );

    texture.needsUpdate = true;
    texture.format = RGBAFormat;
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.flipY = false;

    const spriteMaterial = new SpriteMaterial({
      map: texture,
      alphaTest: 0.1,
      depthWrite: true,
    });
    const sprite = new Sprite(spriteMaterial);

    const aspectRatio = image.bitmap.width / image.bitmap.height;
    sprite.updateMatrix = function () {
      this.matrix.compose(
        this.position,
        this.quaternion,
        this.scale.clone().setX(this.scale.x * aspectRatio),
      );
    };

    return sprite;
  } catch (error) {
    console.error("Failed to create sprite from base64:", error);
    return null;
  }
}

const HomeScene = () => {
  const renderer = useRenderer();
  const musicPlayer = new MusicPlayer();

  const [currentSongStatus, setCurrentSongStatus] = createSignal<PlayerStatus>({
    isPlaying: false,
    currentFile: null,
    metadata: null,
    elapsedTime: 0,
  });
  const [files] = createResource(MUSIC_DIR, scanDir);

  let threeRenderer: ThreeCliRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.OrthographicCamera | null = null;
  let albumArtSprite: THREE.Sprite | null = null;
  let framebufferRenderable: FrameBufferRenderable | null = null;

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

    framebufferRenderable = new FrameBufferRenderable("album-art-fb", {
      width: 23,
      height: 18,
      zIndex: 5,
      position: "absolute",
      right: 4,
      top: 4,
    });
    renderer.root.add(framebufferRenderable);

    threeRenderer = new ThreeCliRenderer(renderer, {
      width: 20,
      height: 18,
      focalLength: 1,
      backgroundColor: RGBA.fromValues(0.1, 0.1, 0.1, 1.0),
    });
    await threeRenderer.init();

    scene = new THREE.Scene();
    const aspectRatio = threeRenderer.aspectRatio;
    const frustumSize = 2;
    camera = new THREE.OrthographicCamera(
      (frustumSize * aspectRatio) / -2,
      (frustumSize * aspectRatio) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000,
    );
    camera.position.z = 5;
    scene.add(camera);
    threeRenderer.setActiveCamera(camera);
  });

  onCleanup(async () => {
    await musicPlayer.stop();

    if (threeRenderer) {
      threeRenderer.destroy();
    }
    if (framebufferRenderable) {
      renderer.root.remove("album-art-fb");
    }
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

    // Start playing and immediately render album art
    const playPromise = musicPlayer.play(path.join(MUSIC_DIR, song));

    // Update status immediately
    const status = musicPlayer.getStatus();
    setCurrentSongStatus(status);

    // Try to get and render album art immediately
    const base64Art = musicPlayer.getAlbumArtBase64();
    if (base64Art && scene && threeRenderer && framebufferRenderable) {
      try {
        if (albumArtSprite && scene) {
          scene.remove(albumArtSprite);
          albumArtSprite = null;
        }

        albumArtSprite = await createSpriteFromBase64(base64Art);
        if (albumArtSprite) {
          albumArtSprite.position.set(0, 0, 0);
          albumArtSprite.scale.set(1.5, 1.5, 1.5);
          scene.add(albumArtSprite);

          await threeRenderer.drawScene(
            scene,
            framebufferRenderable.frameBuffer,
            0,
          );
        }
      } catch (error) {
        console.error("Failed to display album art:", error);
      }
    }

    // Wait for play to complete
    await playPromise;

    // Update status again after play completes
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
    <box height={4}>
      <text>
        {fg("#adff2f")("Search: ")} {fg("#ff8c00")(nameValue())}
      </text>
      <input focused onInput={(value) => setNameValue(value)} />

      <box
        style={{
          position: "absolute",
          right: 2,
          top: 1,
          width: 28,
          height: 30,
          backgroundColor: "#1a1a1a",
          borderColor: "#444444",
          borderStyle: "single",
        }}
      >
        {/* Header */}
        <text>{fg("#adff2f")("Now Playing")}</text>

        {/* Album Art Area (space for the 3D framebuffer) */}
        <box
          style={{
            width: 20,
            height: 18,
            backgroundColor: "#333333",
            marginTop: 1,
            left: 2,
          }}
        />

        {/* Song Info */}
        <text>
          {t`${bold(fg("#ff8c00")(currentSongStatus().metadata?.title?.substring(0, 22) || "No song selected"))}`}
        </text>

        <text>
          {t`${italic(fg("#adff2f")(currentSongStatus().metadata?.artist?.substring(0, 22) || ""))}`}
        </text>

        <text>
          {fg("#ff8c00")(
            currentSongStatus().metadata?.album?.substring(0, 22) || "",
          )}
        </text>

        <text>
          {fg("#888888")(
            `${currentSongStatus().metadata?.year || ""}${currentSongStatus().metadata?.duration ? ` • ${Math.floor(currentSongStatus().metadata.duration / 60)}:${String(Math.floor(currentSongStatus().metadata.duration % 60)).padStart(2, "0")}` : ""}`,
          )}
        </text>

        {/* Control Buttons */}
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
              backgroundColor: "#333333",
              borderColor: "#666666",
              borderStyle: "single",
              marginRight: 1,
            }}
            onMouseDown={() => {
              playPrevious();
            }}
          >
            <text>{fg("#ffffff")("⏮")}</text>
          </box>

          <box
            style={{
              width: 4,
              height: 2,
              backgroundColor: "#333333",
              borderColor: "#666666",
              borderStyle: "single",
            }}
            onMouseDown={() => {
              musicPlayer.togglePlayPause();
              setCurrentSongStatus(musicPlayer.getStatus());
            }}
          >
            <text>
              {fg("#ffffff")(currentSongStatus().isPlaying ? "⏸" : "▶")}
            </text>
          </box>

          <box
            style={{
              width: 4,
              height: 2,
              backgroundColor: "#333333",
              borderColor: "#666666",
              borderStyle: "single",
            }}
            onMouseDown={() => {
              playNext();
            }}
          >
            <text>{fg("#ffffff")("⏭")}</text>
          </box>
        </box>
      </box>

      <box
        title={`Songs (${files()?.filter((x) => x.includes(nameValue()))?.length || 0})`}
        style={{
          flexGrow: 1,
          marginTop: 1,
          borderStyle: "single",
          titleAlignment: "center",
          borderColor: "#f85149",
        }}
      >
        <Show when={files()}>
          <select
            focused
            onSelect={(index) => {
              handleSelect(index);
            }}
            options={files()
              ?.filter((x) => x.includes(nameValue()))
              ?.map((ex, i) => ({
                name: ex,
                description: ex,
                value: i,
              }))}
            style={{
              height: 30,
              backgroundColor: "transparent",
              focusedBackgroundColor: "transparent",
              selectedBackgroundColor: "#334455",
              selectedTextColor: "#adff2f",
              showDescription: false,
            }}
            showScrollIndicator
            wrapSelection
            fastScrollStep={5}
          />
        </Show>
      </box>
    </box>
  );
};

export default HomeScene;
