import type { ProcessorType } from "~~/shared/types/processors";

export interface SingleFileProcess {
  filename: string;
}
export interface DirectoryProcess {
  directory: string;
}

export type ProcessInput = SingleFileProcess | DirectoryProcess;

/**
 * Processors take downloaded files and process them into something
 * that can imported into Drop.
 *
 * We target **portable** games, not installer-based games, as intended
 * by Drop.
 */
export abstract class Processor<T extends ProcessInput> {
  abstract type(): ProcessorType;

  abstract process(input: T, outputDir: string): Promise<void>;
}
