import { useRenderer, useKeyHandler } from "@opentui/solid";
import { createResource, createSignal, For, onMount, Show } from "solid-js";
import { RGBA, bold, underline, t, fg, bg, italic } from "@opentui/core";
import { scanDir } from "../utils/files";

const MUSIC_DIR = "/media/d2du/UG_DRIVE/music/songs/complete";
const HomeScene = () => {
  const renderer = useRenderer();

  const [files] = createResource(MUSIC_DIR, scanDir);
  onMount(() => {
    renderer.useConsole = true;
    renderer.setBackgroundColor(RGBA.fromHex("#334455"));
  });

  const [nameValue, setNameValue] = createSignal("");
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

  function handleSelect(index: number) {
    console.log(files()?.[index]);
  }
  return (
    <box height={4}>
      <text>{t`${italic(fg("#adff2f")("Styled"))} ${bold(fg("#ff8c00")("Text"))}  ${nameValue()}`}</text>
      <text>Name: {nameValue()}</text>
      <input focused onInput={(value) => setNameValue(value)} />
      <box
        title="Examples"
        style={{
          flexGrow: 1,
          marginTop: 1,
          borderStyle: "single",
          titleAlignment: "center",
          focusedBorderColor: "#00AAFF",
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
