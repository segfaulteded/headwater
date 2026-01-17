import type { ProcessorType } from "~~/shared/types/processors";

/**
 * Processors take downloaded files and process them into something
 * that can imported into Drop.
 *
 * We target **portable** games, not installer-based games, as intended
 * by Drop.
 */
export abstract class Processor {
  abstract type(): ProcessorType;
}
