import { Processor } from ".";

export class SevenZipProcessor extends Processor {
  type(): ProcessorType {
    return "7z";
  }
}
