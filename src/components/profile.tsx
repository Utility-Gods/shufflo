import { green, bold } from "@opentui/core";

export default function Preview() {
  return (
    <box style={{ padding: 1 }}>
      <box
        style={{
          width: 23,
          height: 18,
          marginBottom: 1,
          borderStyle: "single",
        }}
      >
        <text>Welcome Home</text>
        <text>Your details go here</text>
      </box>

      <text>{green(bold("Your Name"))}</text>
      <text>Your name goes here</text>
      <text>Your email goes here</text>
      <text>Your phone number goes here</text>

      <text>{green(bold("Your Music"))}</text>
      <text>Your music goes here</text>
    </box>
  );
}
