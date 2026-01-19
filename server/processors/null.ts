import type { ProcessInput, Processor } from ".";

export class NullProcessor<T extends ProcessInput> implements Processor<T> {
  type(): ProcessorType {
    return "null";
  }

  async process(_input: T, _outputDir: string): Promise<void> {}
}
