import { spawn } from "child_process";
import type { DirectoryProcess, Processor } from ".";
import fs from "fs";
import path from "path";

export class GOGUnpacker implements Processor<DirectoryProcess> {
  type(): ProcessorType {
    return "gog-unpacker";
  }

  async process(input: DirectoryProcess, outputDir: string): Promise<void> {
    let realRoot = input.directory;
    const subdir = fs.readdirSync(realRoot).at(0);
    if (subdir) {
      const subdirPath = path.join(realRoot, subdir);
      const stat = fs.statSync(subdirPath);
      if (stat.isDirectory()) {
        realRoot = subdirPath;
      }
    }

    const exeFile = fs.readdirSync(realRoot).find((v) => v.endsWith(".exe"));
    if (!exeFile)
      throw new Error(
        "No .exe file found in download - did we download it properly?",
      );

    const childProcess = spawn(
      `innoextract -e "${shellSanitize(path.join(realRoot, exeFile))}" -d "${shellSanitize(outputDir)}"`,
      { shell: true },
    );
    await new Promise<void>((resolve, reject) => {
      childProcess.stderr.pipe(process.stdout);
      childProcess.stdout.pipe(process.stdout);

      childProcess.addListener("exit", (code) => {
        if (code !== 0) return reject(code);
        resolve();
      });
      childProcess.addListener("error", (err) => {
        console.error(err);
      });
      childProcess.addListener("message", (message) => {
        console.log(`[innoextract] ${message}`);
      });
    });
  }
}
