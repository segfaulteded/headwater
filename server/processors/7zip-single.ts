import type { SingleFileProcess } from ".";
import { Processor } from ".";
import { spawn } from "child_process";
import { shellSanitize } from "~~/shared/utils/shell";

export class SevenZipSingleProcessor extends Processor<SingleFileProcess> {
  type(): ProcessorType {
    return "7z";
  }

  async process(input: SingleFileProcess, outputDir: string): Promise<void> {
    const childProcess = spawn(
      `7z x -aoa -o"${shellSanitize(outputDir)}" -- "${shellSanitize(input.filename)}"`,
      { shell: true },
    );
    await new Promise<void>((resolve, reject) => {
      childProcess.addListener("exit", (code) => {
        if (code !== 0) return reject(code);
        resolve();
      });
      childProcess.addListener("error", (err) => {
        console.error(err);
      });
      childProcess.addListener("message", (message) => {
        console.log(`[7z] ${message}`);
      });
      childProcess.stderr.pipe(process.stdout);
      childProcess.stdout.pipe(process.stdout);
    });
  }
}
