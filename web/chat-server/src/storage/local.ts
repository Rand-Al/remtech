import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export class LocalAttachmentStorage {
  private readonly root: string;

  constructor(root = process.env.RT_UPLOAD_DIR ?? "data/uploads") {
    this.root = resolve(process.cwd(), root);
  }

  async save(requestId: string, mimeType: string, content: Buffer): Promise<string> {
    const extension = MIME_EXTENSIONS[mimeType];
    if (!extension) throw new Error("Unsupported attachment type");

    const directory = resolve(this.root, requestId);
    await mkdir(directory, { recursive: true });
    const key = requestId + "/" + randomUUID() + "." + extension;
    await writeFile(resolve(this.root, key), content);
    return key;
  }

  async read(key: string): Promise<Buffer> {
    const filePath = resolve(this.root, key);
    const rootPrefix = this.root.endsWith(sep) ? this.root : this.root + sep;
    if (!filePath.startsWith(rootPrefix)) {
      throw new Error("Invalid attachment path");
    }
    return readFile(filePath);
  }

  async remove(key: string): Promise<void> {
    const filePath = resolve(this.root, key);
    const rootPrefix = this.root.endsWith(sep) ? this.root : this.root + sep;
    if (!filePath.startsWith(rootPrefix)) return;
    await unlink(filePath).catch(() => undefined);
  }
}
