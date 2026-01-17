import type { TransportType } from "../types/transports";

interface ColourGroup {
  background: string;
  text: string;
  outline: string;
}

export const TRANSPORT_COLOURS: { [key in TransportType]: ColourGroup } = {
  http: {
    background: "bg-green-600",
    text: "text-green-600",
    outline: "outline-green-600",
  },
  torrent: {
    background: "bg-red-600",
    text: "text-red-600",
    outline: "outline-red-600",
  },
};
