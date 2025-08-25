import { t,white, bold, italic, green, yellow, cyan, FrameBufferRenderable, GroupRenderable, RGBA } from "@opentui/core";
import { useRenderer } from "@opentui/solid";
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
import { onMount, onCleanup, createEffect } from "solid-js";
import type { PlayerStatus } from "../utils/music-player";

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

interface PreviewProps {
  currentSongStatus: () => PlayerStatus;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  albumArtBase64?: string | null;
}

export function Preview(props: PreviewProps) {
  const renderer = useRenderer();
  let albumArtContainer: GroupRenderable;
  let threeRenderer: ThreeCliRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.OrthographicCamera | null = null;
  let albumArtSprite: THREE.Sprite | null = null;
  let framebufferRenderable: FrameBufferRenderable | null = null;

  onMount(async () => {
    framebufferRenderable = new FrameBufferRenderable("album-art-fb", {
      width: 23,
      height: 18,
      zIndex: 5,
    });
    albumArtContainer?.add(framebufferRenderable);

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

  onCleanup(() => {
    if (threeRenderer) {
      threeRenderer.destroy();
    }
    if (framebufferRenderable && albumArtContainer) {
      albumArtContainer.remove("album-art-fb");
    }
  });

  createEffect(() => {
    if (props.albumArtBase64) {
      updateAlbumArt(props.albumArtBase64);
    }
  });

  const updateAlbumArt = async (base64Art: string | null) => {
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
  };

  return (
    <box
      style={{
        flexBasis: 30,
        flexShrink: 0,
        flexGrow: 0,
        marginLeft: 1,
      }}
    >
      <group ref={albumArtContainer} style={{ width: 23, height: 18, marginTop: 1, left: 2 }} />
      <text>{green(bold("▶ Now Playing"))}</text>

      <text>
        {bold(
          yellow(
            props.currentSongStatus().metadata?.title?.substring(0, 22) ||
              "No song selected",
          ),
        )}
      </text>

      <text>
        {italic(
          green(
            props.currentSongStatus().metadata?.artist?.substring(0, 22) || "",
          ),
        )}
      </text>

      <text>
        {yellow(
          props.currentSongStatus().metadata?.album?.substring(0, 22) || "",
        )}
      </text>

      <text>
        {cyan(
          `${props.currentSongStatus().metadata?.year || ""}${props.currentSongStatus().metadata?.duration ? ` • ${Math.floor(props.currentSongStatus()?.metadata?.duration ?? 0 / 60)}:${String(Math.floor(props.currentSongStatus().metadata?.duration ?? 0 % 60)).padStart(2, "0")}` : ""}`,
        )}
      </text>

      <text>
        {props.currentSongStatus().elapsedTime !== undefined
          ? cyan(
              `${Math.floor(props.currentSongStatus().elapsedTime! / 60)}:${String(Math.floor(props.currentSongStatus().elapsedTime! % 60)).padStart(2, "0")}`,
            )
          : ""}
      </text>

      <box
        style={{
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <box
          style={{
            width: 4,
            height: 2,
          }}
          onMouseDown={props.onPrevious}
        >
          <text>{yellow("⏮")}</text>
        </box>

        <box
          style={{
            width: 4,
            height: 2,
          }}
          onMouseDown={props.onPlayPause}
        >
          <text>
            {green(props.currentSongStatus().isPlaying ? "⏸" : "▶")}
          </text>
        </box>

        <box
          style={{
            width: 4,
            height: 2,
          }}
          onMouseDown={props.onNext}
        >
          <text>{yellow("⏭")}</text>
        </box>
      </box>
    </box>
  );
}
