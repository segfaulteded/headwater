import type { TransportType } from "~~/shared/types/transports";
import type { Transport } from ".";

export default class HTTPTransport implements Transport {
  type(): TransportType {
    return "http";
  }
}
