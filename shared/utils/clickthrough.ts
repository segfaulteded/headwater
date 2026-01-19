import { z } from "zod";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

export const CLICKTHROUGH_LINK_BYPASSES: Map<
  string,
  (link: string) => Promise<string>
> = new Map([
  [new URL("https://datanodes.to").host, bypassDatanodes], /// Multiline
]);

const datanodesResponse = z.object({
  url: z.string(),
});

export async function bypassDatanodes(link: string): Promise<string> {
  const [fileID, fileName] = new URL(link).pathname.split("/").slice(1);
  if (!fileID || !fileName)
    throw new Error("Could not find file ID or file name");

  const headers = new Headers();
  headers.set(
    "Cookie",
    `lang=english; file_code=${fileID}`,
  );
  headers.set("Host", "datanodes.to");
  headers.set("Origin", "https://datanodes.to");
  headers.set("Referer", "https://datanodes.to/download");
  headers.set("User-Agent", USER_AGENT);

  const formData = new FormData();
  const payload = {
    op: "download2",
    rand: "",
    id: fileID,
    fname: fileName,
    referer: "",
    method_free: "Free Download >>",
    method_premium: "",
    "__dl": "1",
  };
  for (const [k, v] of Object.entries(payload)) {
    formData.set(k, v);
  }

  const response = await $fetch("https://datanodes.to/download", {
    headers,
    method: "POST",
    body: formData,
    redirect: "manual",
  });

  const { url } = datanodesResponse.parse(response);

  return decodeURIComponent(url);
}
