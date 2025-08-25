import { readdir } from "node:fs/promises";

export async function scanDir(dir: string)  {
  const files = await readdir(dir,{
  });
  console.log(files);
  return files;
};

