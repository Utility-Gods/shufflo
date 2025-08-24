import { render, useRenderer } from "@opentui/solid";
import { createSignal, onMount } from "solid-js";
import { RGBA, bold, underline, t, fg, bg, italic } from "@opentui/core";

const InputScene = () => {
  const renderer = useRenderer();

  onMount(() => {
    renderer.setCursorColor(RGBA.fromHex("#f85149"));
    renderer.setBackgroundColor(RGBA.fromHex("#1e1"));
  });

  const [nameValue, setNameValue] = createSignal("");

  return (
    <box height={4}>
      <text>{t`${italic(fg("#adff2f")("Styled"))} ${bold(fg("#ff8c00")("Text"))} also works! ${nameValue()}`}</text>
      <text>Name: t{nameValue()}</text>
      <input focused onInput={(value) => setNameValue(value)} />
    </box>
  );
};

render(() => <InputScene />);
