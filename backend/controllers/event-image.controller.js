import { fileTypeFromBuffer } from "file-type";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db.js";

import { deleteEventImage } from "../utils/image.utils.js";

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

const uploadDirectory = fileURLToPath(
  new URL("../uploads/", import.meta.url)
);

export async function uploadEventImage(req, res) {
  const eventId = Number(req.params.id);

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "INVALID_EVENT_ID"
    });
  }

  if (!req.file) {
    return res.status(400).json({
      error: "IMAGE_REQUIRED"
    });
  }

  let savedFilePath = null;

  try {
    // Dateityp anhand der Datei statt nur anhand der Endung prüfen.
    const fileType = await fileTypeFromBuffer(req.file.buffer);
    const extension = allowedImageTypes.get(fileType?.mime);

    if (
      !extension ||
      fileType.ext !== extension ||
      req.file.mimetype !== fileType.mime
    ) {
      return res.status(400).json({
        error: "INVALID_IMAGE_TYPE"
      });
    }

    
    const existingEvent = await pool.query(
      `SELECT image_path FROM event
      WHERE id = $1
        AND user_id = $2
        AND status IN ('draft', 'published')`,
      [eventId, req.user.id]
    );


    if (existingEvent.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_FOUND"
      });
    }

    const previousImagePath = existingEvent.rows[0].image_path;

    const fileName = `${randomUUID()}.${extension}`;
    savedFilePath = path.join(uploadDirectory, fileName);

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(savedFilePath, req.file.buffer, {
      flag: "wx"
    });

    const imagePath = `uploads/${fileName}`;

    
    const result = await pool.query(
      `UPDATE event
      SET image_path = $1,
          updated_at = NOW()
      WHERE id = $2
        AND user_id = $3
        AND status IN ('draft', 'published')
      RETURNING id, title, image_path, status`,
      [imagePath, eventId, req.user.id]
    );


    if (result.rows.length === 0) {
      await unlink(savedFilePath);
      savedFilePath = null;

      return res.status(404).json({
        error: "EVENT_NOT_FOUND"
      });
    }

    // Altes Bild erst nach erfolgreichem Upload entfernen.
    if (previousImagePath && previousImagePath !== imagePath) {
      try {
        await deleteEventImage(previousImagePath);
      } catch (imageError) {
        console.error(
          "Altes Event-Bild konnte nicht gelöscht werden:",
          imageError.message
        );
      }
    }

    return res.status(200).json({
      message: "IMAGE_UPLOADED",
      event: result.rows[0]
    });

  } catch (error) {
    // Neu hochgeladene Datei bei einem Fehler wieder löschen.
    if (savedFilePath) {
      await unlink(savedFilePath).catch(() => { });
    }

    console.error("Bild-Upload fehlgeschlagen:", error.message);

    return res.status(500).json({
      error: "IMAGE_UPLOAD_FAILED"
    });
  }
}
