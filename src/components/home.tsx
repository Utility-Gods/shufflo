import { useRenderer, useKeyHandler } from "@opentui/solid";
import { createResource, createSignal, For, onMount } from "solid-js";
import { RGBA, bold, underline, t, fg, bg, italic } from "@opentui/core";
import { readdir } from "node:fs/promises";

const scanDir = async (dir: string) => {
  const files = await readdir(dir);
  console.log(files);
  return files;
};

const MUSIC_DIR= '/media/d2du/UG_DRIVE/music/songs/complete';
const HomeScene = () => {
  const renderer = useRenderer();

  const [files] = createResource(MUSIC_DIR, scanDir);
  onMount(() => {
    renderer.useConsole = true;
    renderer.setBackgroundColor(RGBA.fromHex("#334455"));
  });

  const [nameValue, setNameValue] = createSignal("Sid");
  useKeyHandler((key) => {
    switch (key.name) {
      case "t":
        renderer.console.toggle();
        break;
    }

    switch (key.raw) {
      case "\u0003":
        renderer.stop();
        process.exit(0);
    }
  });

  return (
    <box height={4}>
      <text>{t`${italic(fg("#adff2f")("Styled"))} ${bold(fg("#ff8c00")("Text"))}  ${nameValue()}`}</text>
      <text>Name: {nameValue()}</text>
      <input focused onInput={(value) => setNameValue(value)} />
      <For each={files()}>{(item, index) => <text>{item}</text>}</For>
    </box>
  );
};

export default HomeScene;
