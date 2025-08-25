import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const AUDIO_EXTENSIONS = [
  '.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', 
  '.wma', '.opus', '.aiff', '.aif', '.dsf', '.dff',
  '.atff', '.mp4', '.3gp', '.amr', '.ape', '.au', '.ra'
];

export async function scanDir(dir: string): Promise<string[]> {
  const files: string[] = [];
  let totalEntries = 0;
  let directoriesFound = 0;
  let filesSkipped = 0;
  
  async function scanRecursively(currentDir: string, relativePath = '') {
    try {
      // Force include ALL files including hidden ones
      const entries = await readdir(currentDir, { encoding: 'utf8' });
      console.log(`Scanning ${currentDir}: found ${entries.length} entries`);
      totalEntries += entries.length;
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        const relativeFilePath = relativePath ? path.join(relativePath, entry) : entry;
        
        try {
          const stats = await stat(fullPath);
          
          if (stats.isFile()) {
            const ext = path.extname(entry).toLowerCase();
            // Only include audio files
            if (AUDIO_EXTENSIONS.includes(ext)) {
              files.push(relativeFilePath);
            }
          } else if (stats.isDirectory()) {
            directoriesFound++;
            console.log(`Found directory: ${relativeFilePath}`);
            // Recursively scan subdirectories
            await scanRecursively(fullPath, relativeFilePath);
          }
        } catch (error) {
          filesSkipped++;
          console.warn(`Could not stat ${fullPath}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentDir}:`, error);
    }
  }
  
  await scanRecursively(dir);
  
  console.log(`SCAN COMPLETE:`);
  console.log(`- Total entries examined: ${totalEntries}`);
  console.log(`- Files added: ${files.length}`);
  console.log(`- Directories found: ${directoriesFound}`);
  console.log(`- Files skipped due to errors: ${filesSkipped}`);
  
  return files.sort();
}
