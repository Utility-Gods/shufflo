import { green, yellow, bold } from "@opentui/core";

export function Preview() {
  return (
    <box style={{ padding: 1 }}>
      <box style={{ width: 23, height: 18, marginBottom: 1, borderStyle: "single" }}>
        <text>Album Art</text>
        <text>Goes Here</text>
      </box>
      <text>{green(bold("▶ Now Playing"))}</text>
      <text>No song selected</text>
      <text>0:00</text>
      <box style={{ flexDirection: "row", justifyContent: "center", marginTop: 1 }}>
        <text>{yellow("⏮")}</text>
        <text>{green("▶")}</text>
        <text>{yellow("⏭")}</text>
      </box>
    </box>
  );
}