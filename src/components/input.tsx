import { useRenderer, useKeyHandler } from "@opentui/solid";
import { createSignal, onMount } from "solid-js";
import { RGBA, bold, underline, t, fg, bg, italic } from "@opentui/core";

const InputScene = () => {
  const renderer = useRenderer();

  onMount(() => {
    renderer.useConsole = true;
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
    </box>
  );
};

export default InputScene;
