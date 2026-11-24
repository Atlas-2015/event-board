import { unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const uploadDirectory = fileURLToPath(
  new URL("../uploads/", import.meta.url)
);

export async function deleteEventImage(imagePath) {
  if (typeof imagePath !== "string") {
    return false;
  }

  // Nur generierte UUID-Dateinamen aus dem Upload-Verzeichnis zulassen.
  const pattern =
    /^uploads\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp))$/i;

  const match = imagePath.match(pattern);

  if (!match) {
    return false;
  }

  const filePath = path.join(uploadDirectory, match[1]);

  try {
    await unlink(filePath);
    return true;

  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}
