import pool from "../db.js";

import { deleteEventImage } from "../utils/image.utils.js";

const allowedCategories = new Set([
  "workshops",
  "technology",
  "team",
  "personal",
  "sports",
  "trips",
  "culture",
  "other"
]);

// Einheitliche Titelprüfung beim Erstellen, Bearbeiten und Veröffentlichen.
function isValidEventTitle(value) {
  if (typeof value !== "string") {
    return false;
  }

  const length = value.trim().length;
  return length >= 3 && length <= 100;
}

function isValidEventDate(value) {
  if (typeof value !== "string") {
    return false;
  }

  // Zeitangaben im ISO-8601-Format mit Zeitzone prüfen.
  const datePattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

  if (!datePattern.test(value)) {
    return false;
  }

  return Number.isFinite(new Date(value).getTime());
}

function isEventComplete(event) {
  return (
    isValidEventTitle(event.title) &&
    typeof event.short_description === "string" &&
    event.short_description.trim().length > 0 &&
    typeof event.full_description === "string" &&
    event.full_description.trim().length > 0 &&
    allowedCategories.has(event.category) &&
    event.starts_at !== null &&
    typeof event.location === "string" &&
    event.location.trim().length > 0 &&
    typeof event.image_path === "string" &&
    event.image_path.trim().length > 0
  );
}

export async function getPublishedEvents(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         e.id,
         e.title,
         e.short_description,
         e.category,
         e.starts_at,
         e.ends_at,
         e.location,
         e.image_path,
         u.display_name AS author
       FROM event AS e
       JOIN "user" AS u ON e.user_id = u.id
       WHERE e.status = 'published'
       ORDER BY e.starts_at ASC`
    );

    return res.status(200).json({
      events: result.rows
    });
  } catch (error) {
    console.error("Fehler beim Laden der Events:", error.message);

    return res.status(500).json({
      error: "EVENTS_FETCH_FAILED"
    });
  }
}

export async function createEvent(req, res) {
  const { title } = req.body ?? {};

  if (!isValidEventTitle(title)) {
    return res.status(400).json({
      error: "INVALID_EVENT_TITLE"
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO event (user_id, title, status)
       VALUES ($1, $2, 'draft')
       RETURNING id, user_id, title, status, created_at`,
      [req.user.id, title.trim()]
    );

    return res.status(201).json({
      message: "EVENT_CREATED",
      event: result.rows[0]
    });
  } catch (error) {
    console.error("Fehler beim Erstellen des Events:", error.message);

    return res.status(500).json({
      error: "EVENT_CREATE_FAILED"
    });
  }
}

export async function updateEvent(req, res) {
  const eventId = Number(req.params.id);

  const {
    title,
    shortDescription,
    fullDescription,
    category,
    startsAt,
    endsAt,
    location
  } = req.body ?? {};

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "INVALID_EVENT_ID"
    });
  }

  if (
    title === undefined &&
    shortDescription === undefined &&
    fullDescription === undefined &&
    category === undefined &&
    startsAt === undefined &&
    endsAt === undefined &&
    location === undefined
  ) {
    return res.status(400).json({
      error: "NO_UPDATE_DATA"
    });
  }

  if (title !== undefined && !isValidEventTitle(title)) {
    return res.status(400).json({
      error: "INVALID_EVENT_TITLE"
    });
  }

  if (
    shortDescription !== undefined &&
    (
      typeof shortDescription !== "string" ||
      !shortDescription.trim() ||
      shortDescription.trim().length > 200
    )
  ) {
    return res.status(400).json({
      error: "INVALID_SHORT_DESCRIPTION"
    });
  }

  if (
    fullDescription !== undefined &&
    (
      typeof fullDescription !== "string" ||
      !fullDescription.trim() ||
      fullDescription.trim().length > 3000
    )
  ) {
    return res.status(400).json({
      error: "INVALID_FULL_DESCRIPTION"
    });
  }

  if (
    category !== undefined &&
    !allowedCategories.has(category)
  ) {
    return res.status(400).json({
      error: "INVALID_EVENT_CATEGORY"
    });
  }

  if (
    startsAt !== undefined &&
    !isValidEventDate(startsAt)
  ) {
    return res.status(400).json({
      error: "INVALID_START_DATE"
    });
  }

  if (
    endsAt !== undefined &&
    endsAt !== null &&
    !isValidEventDate(endsAt)
  ) {
    return res.status(400).json({
      error: "INVALID_END_DATE"
    });
  }

  if (
    startsAt !== undefined &&
    endsAt !== undefined &&
    endsAt !== null &&
    new Date(endsAt).getTime() <= new Date(startsAt).getTime()
  ) {
    return res.status(400).json({
      error: "INVALID_EVENT_DATE_RANGE"
    });
  }

  if (
    location !== undefined &&
    (
      typeof location !== "string" ||
      !location.trim() ||
      location.trim().length > 255
    )
  ) {
    return res.status(400).json({
      error: "INVALID_EVENT_LOCATION"
    });
  }

  try {
    if (startsAt !== undefined) {
      const existingEvent = await pool.query(
        `SELECT status FROM event
        WHERE id = $1
          AND user_id = $2
          AND status IN ('draft', 'published')`,
        [eventId, req.user.id]
      );

      if (
        existingEvent.rows[0]?.status === "published" &&
        new Date(startsAt).getTime() <= Date.now()
      ) {
        return res.status(400).json({
          error: "EVENT_START_NOT_FUTURE"
        });
      }
    }

    // Änderungen nur durch den Eigentümer der Veranstaltung erlauben.
    const result = await pool.query(
      `UPDATE event
       SET title = COALESCE($1, title),
           short_description = COALESCE($2, short_description),
           full_description = COALESCE($3, full_description),
           category = COALESCE($4, category),
           starts_at = COALESCE($5::timestamptz, starts_at),
           ends_at = CASE
             WHEN $6::boolean THEN $7::timestamptz
             ELSE ends_at
           END,
           location = COALESCE($8, location),
           updated_at = NOW()
       WHERE id = $9
         AND user_id = $10
         AND status IN ('draft', 'published')
       RETURNING
         id,
         title,
         short_description,
         full_description,
         category,
         starts_at,
         ends_at,
         location,
         status,
         updated_at`,
      [
        title === undefined ? null : title.trim(),
        shortDescription === undefined ? null : shortDescription.trim(),
        fullDescription === undefined ? null : fullDescription.trim(),
        category === undefined ? null : category,
        startsAt === undefined ? null : startsAt,
        endsAt !== undefined,
        endsAt === undefined ? null : endsAt,
        location === undefined ? null : location.trim(),
        eventId,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_FOUND"
      });
    }

    return res.status(200).json({
      message: "EVENT_UPDATED",
      event: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23514") {
      return res.status(400).json({
        error: "INVALID_EVENT_DATE_RANGE"
      });
    }

    console.error("Fehler beim Bearbeiten:", error.message);

    return res.status(500).json({
      error: "EVENT_UPDATE_FAILED"
    });
  }
}

export async function publishEvent(req, res) {
  const eventId = Number(req.params.id);

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "INVALID_EVENT_ID"
    });
  }

  try {
    const existingEvent = await pool.query(
      `SELECT *
       FROM event
       WHERE id = $1
         AND user_id = $2
         AND status = 'draft'`,
      [eventId, req.user.id]
    );

    if (existingEvent.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_FOUND"
      });
    }

    const event = existingEvent.rows[0];

    if (!isEventComplete(event)) {
      return res.status(400).json({
        error: "EVENT_INCOMPLETE"
      });
    }

    // Veröffentlichte Veranstaltungen müssen in der Zukunft beginnen.
    if (
      !Number.isFinite(new Date(event.starts_at).getTime()) ||
      new Date(event.starts_at).getTime() <= Date.now()
    ) {
      return res.status(400).json({
        error: "EVENT_START_NOT_FUTURE"
      });
    }

    const result = await pool.query(
      `UPDATE event
       SET status = 'published',
           updated_at = NOW()
       WHERE id = $1
         AND user_id = $2
         AND status = 'draft'
         AND starts_at > NOW()
       RETURNING id, title, status, starts_at, updated_at`,
      [eventId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        error: "EVENT_PUBLISH_CONFLICT"
      });
    }

    return res.status(200).json({
      message: "EVENT_PUBLISHED",
      event: result.rows[0]
    });
  } catch (error) {
    console.error("Fehler beim Veröffentlichen:", error.message);

    return res.status(500).json({
      error: "EVENT_PUBLISH_FAILED"
    });
  }
}

export async function getEventById(req, res) {
  const eventId = Number(req.params.id);

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "INVALID_EVENT_ID"
    });
  }

  try {
    const result = await pool.query(
      `SELECT
         e.id,
         e.title,
         e.short_description,
         e.full_description,
         e.category,
         e.starts_at,
         e.ends_at,
         e.location,
         e.image_path,
         e.status,
         e.created_at,
         u.display_name AS author
       FROM event AS e
       JOIN "user" AS u ON e.user_id = u.id
       WHERE e.id = $1
         AND e.status = 'published'`,
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_FOUND"
      });
    }

    return res.status(200).json({
      event: result.rows[0]
    });
  } catch (error) {
    console.error("Fehler beim Laden des Events:", error.message);

    return res.status(500).json({
      error: "EVENT_FETCH_FAILED"
    });
  }
}

export async function getMyDrafts(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         id,
         title,
         short_description,
         category,
         starts_at,
         location,
         image_path,
         status,
         updated_at
       FROM event
       WHERE user_id = $1
         AND status = 'draft'
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      events: result.rows
    });
  } catch (error) {
    console.error("Fehler beim Laden der Entwürfe:", error.message);

    return res.status(500).json({
      error: "DRAFTS_FETCH_FAILED"
    });
  }
}

export async function getMyEvents(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         id,
         title,
         short_description,
         full_description,
         category,
         starts_at,
         ends_at,
         location,
         image_path,
         status,
         created_at,
         updated_at
       FROM event
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      events: result.rows
    });
  } catch (error) {
    console.error("Fehler beim Laden eigener Events:", error.message);

    return res.status(500).json({
      error: "MY_EVENTS_FETCH_FAILED"
    });
  }
}

export async function deleteEvent(req, res) {
  const eventId = Number(req.params.id);

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "INVALID_EVENT_ID"
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM event
       WHERE id = $1
         AND user_id = $2
         AND status IN ('draft', 'published')
       RETURNING id, title, image_path`,
      [eventId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_FOUND"
      });
    }

    const deletedDraft = result.rows[0];

    if (deletedDraft.image_path) {
      try {
        await deleteEventImage(deletedDraft.image_path);
      } catch (imageError) {
        console.error(
          "Event-Bild konnte nicht gelöscht werden:",
          imageError.message
        );
      }
    }

    return res.status(200).json({
      message: "EVENT_DELETED",
      event: result.rows[0]
    });
  } catch (error) {
    console.error("Fehler beim Löschen:", error.message);

    return res.status(500).json({
      error: "DRAFT_DELETE_FAILED"
    });
  }
}
