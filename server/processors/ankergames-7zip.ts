import { Processor, type SingleFileProcess } from ".";
import { SevenZipSingleProcessor } from "./7zip-single";
import fs from "fs";
import path from "path";

/**
 * AnkerGames' zips always have an "inner" directory when extracted with 7z
 * It needs to be "unwrapped"
 */
export class AnkerGamesSevenZipProcessor extends Processor<SingleFileProcess> {
  private sevenZip: SevenZipSingleProcessor = new SevenZipSingleProcessor();

  type(): ProcessorType {
    return "ankergames-7z";
  }

  async process(input: SingleFileProcess, outputDir: string): Promise<void> {
    await this.sevenZip.process(input, outputDir);

    const directoryName = fs.readdirSync(outputDir).find((v) => {
      const stat = fs.statSync(path.join(outputDir, v));
      return stat.isDirectory();
    });
    if (!directoryName)
      throw new Error("Found no AnkerGames directory in output directory");

    const directoryPath = path.join(outputDir, directoryName);
    const rootFiles = fs.readdirSync(directoryPath);
    for (const file of rootFiles) {
      const oldPath = path.join(directoryPath, file);
      const newPath = path.join(outputDir, file);

      fs.renameSync(oldPath, newPath);
    }
  }
}
