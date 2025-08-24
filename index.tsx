import { render } from "@opentui/solid";
import { App } from "./src/App";
import { ConsolePosition } from "@opentui/core";

await render(App, {
  targetFps: 30,
  consoleOptions: {
    position: ConsolePosition.BOTTOM,
    maxStoredLogs: 1000,
    sizePercent: 40,
    startInDebugMode: true,
  },
});
