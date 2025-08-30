import { createSignal, createResource, Show } from "solid-js";
import { green, yellow, cyan } from "@opentui/core";
import { Effect, Console, pipe } from "effect";
import path from "path";
import { file, readdir } from "bun";

interface FileEntry {
  name: string;
  fullPath: string;
  isDirectory: boolean;
}

// Effect-based directory reader with Bun's filesystem API
const readDirectory = (dirPath: string) => 
  Effect.tryPromise({
    try: async () => {
      const entries = await readdir(dirPath);
      const fileEntries: FileEntry[] = [];
      
      // Audio file extensions to show
      const audioExtensions = new Set(['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac', '.wma']);
      
      for (const entry of entries) {
        try {
          // Skip hidden files and directories (starting with .)
          if (entry.startsWith('.')) continue;
          
          const fullPath = path.join(dirPath, entry);
          const bunFile = file(fullPath);
          const exists = await bunFile.exists();
          
          if (!exists) continue;
          
          // Check if it's a directory using Bun's file API
          const stats = await Bun.file(fullPath).stat();
          const isDirectory = stats.isDirectory;
          
          // For files, only show audio files
          if (!isDirectory) {
            const ext = path.extname(entry).toLowerCase();
            if (!audioExtensions.has(ext)) continue;
          }
          
          fileEntries.push({
            name: entry,
            fullPath,
            isDirectory
          });
        } catch {
          // Skip entries we can't access
        }
      }
      
      return fileEntries.sort((a, b) => {
        // Directories first, then files
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    },
    catch: (error) => new Error(`Failed to read directory: ${error}`)
  });

interface FileSelectorProps {
  onDirectorySelect: (path: string) => void;
}

export function FileSelector(props: FileSelectorProps) {
  const [currentPath, setCurrentPath] = createSignal(process.env.HOME || "/home");
  const [files] = createResource(currentPath, (path) => 
    Effect.runPromise(
      pipe(
        readDirectory(path),
        Effect.tapError(Console.error)
      )
    ).catch(() => [])
  );

  const handleSelect = (index: number) => {
    const fileList = files();
    if (!fileList || !fileList[index]) return;
    
    const selected = fileList[index];
    
    if (selected.isDirectory) {
      // Navigate into directory
      setCurrentPath(selected.fullPath);
    } else {
      // If it's a file, select the parent directory
      props.onDirectorySelect(path.dirname(selected.fullPath));
    }
  };

  const goUp = () => {
    const parent = path.dirname(currentPath());
    if (parent !== currentPath()) {
      setCurrentPath(parent);
    }
  };

  const selectCurrentDirectory = () => {
    props.onDirectorySelect(currentPath());
  };

  return (
    <box
      title="Select Music Directory"
      titleAlignment="center"
      borderStyle="heavy"
      borderColor="cyan"
      style={{ flexGrow: 1 }}
    >
      <text>{cyan("Current: ")} {currentPath()}</text>
      
      <box style={{ flexDirection: "row", marginTop: 1, marginBottom: 1 }}>
        <text onMouseDown={goUp} style={{ marginRight: 2 }}>
          {yellow("← Parent")}
        </text>
        <text onMouseDown={selectCurrentDirectory}>
          {green("✓ Select This Directory")}
        </text>
      </box>

      <Show when={files()}>
        <select
          focused
          onSelect={handleSelect}
          options={files()?.map((entry, i) => ({
            name: `${entry.isDirectory ? "📁" : "📄"} ${entry.name}`,
            description: entry.isDirectory ? "Directory" : "File",
            value: i,
          })) || []}
          style={{
            height: 25,
            backgroundColor: "transparent",
            focusedBackgroundColor: "transparent",
            showDescription: true,
          }}
          showScrollIndicator
          wrapSelection
          fastScrollStep={5}
        />
      </Show>
    </box>
  );
}