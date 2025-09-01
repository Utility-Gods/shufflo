import { Chunk, Data, Effect, pipe, Stream } from "effect";
import { readdir } from "node:fs/promises";
import path from "node:path";
import type { FileEntry } from "../types";

class FileSystemReadError extends Data.TaggedError("FileSystemReadError") {}

export async function scanDir(dir: string): Promise<string[]> {
  const scanDirectoryStream = (dir: string) =>
    Stream.fromEffect(
      Effect.tryPromise({
        try: () => readdir(dir, { encoding: "utf8" }),
        catch: (error) => new FileSystemReadError(),
      }),
    );

  const scaneRecursivelyStream = (
    dir: string,
    relativePath = "",
  ): Stream.Stream<string, FileSystemReadError> =>
    pipe(
      scanDirectoryStream(dir),
      Stream.flatMap(Stream.fromIterable),
      Stream.map((name) => {
        return {
          name,
        };
      }),
      Stream.map((entry) => ({
        name: entry.name,
        fullPath: path.join(dir, entry.name),
      })),
      Stream.map((entry) => {
        const relativeFilePath = relativePath
          ? path.join(relativePath, entry.name)
          : entry.name;
        return {
          ...entry,
          relativePath: relativeFilePath,
        };
      }),
      Stream.flatMap((entry) =>
        Stream.fromEffect(
          Effect.tryPromise({
            try: async () => {
              const stats = await Bun.file(entry.fullPath).stat();
              return {
                ...entry,
                isDirectory: stats.isDirectory(),
              };
            },
            catch: () => new FileSystemReadError(),
          }),
        ),
      ),
      Stream.flatMap((entry) =>
        entry.isDirectory
          ? scaneRecursivelyStream(entry.fullPath, entry.relativePath)
          : Stream.make(entry.relativePath),
      ),
    );

  const allFiles = await pipe(
    scaneRecursivelyStream(dir),
    Stream.runCollect,
    Effect.map((chunk) => chunk.pipe(Chunk.toArray)),
    Effect.runPromise,
  );

  console.log("All files:", allFiles);
  return allFiles.sort();
}

export async function readDirectory(dirPath: string) {
  const scanDirectoryStream = pipe(
    Stream.fromEffect(
      Effect.tryPromise({
        try: () => readdir(dirPath, { encoding: "utf8" }),
        catch: (error) => new FileSystemReadError(),
      }),
    ),
    Stream.flatMap(Stream.fromIterable),
    Stream.map((name) => {
      return {
        name,
      };
    }),
    Stream.map((entry) => ({
      name: entry.name,
      fullPath: path.join(dirPath, entry.name),
    })),
    Stream.filter((entry) => !entry.name.startsWith(".")),
    Stream.flatMap((entry) =>
      Stream.fromEffect(
        Effect.tryPromise({
          try: async () => {
            const stats = await Bun.file(entry.fullPath).stat();
            return {
              ...entry,
              isDirectory: stats.isDirectory(),
            };
          },
          catch: () => new FileSystemReadError(),
        }),
      ),
    ),
  );

  const allFiles = await pipe(
    scanDirectoryStream,
    Stream.runCollect,
    Effect.map((chunk) => chunk.pipe(Chunk.toArray)),
    Effect.runPromise,
  );
  return allFiles;
}
