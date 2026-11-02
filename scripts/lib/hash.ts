import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/** sha256 of a file's contents, hex. */
export function fileHash(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("error", reject)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve(hash.digest("hex")));
  });
}
