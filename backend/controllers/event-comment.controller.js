import pool from "../db.js";

export async function createEventComment(req, res) {
  const eventId = Number(req.params.id);
  const { text } = req.body ?? {};

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "INVALID_EVENT_ID"
    });
  }

  if (typeof text !== "string") {
    return res.status(400).json({
      error: "INVALID_COMMENT"
    });
  }

  const commentText = text.trim();

  if (!commentText || commentText.length > 500) {
    return res.status(400).json({
      error: "INVALID_COMMENT_LENGTH"
    });
  }

  try {

    const result = await pool.query(
      `INSERT INTO event_comment (user_id, event_id, content)
    SELECT $1, id, $3
    FROM event
    WHERE id = $2
        AND status = 'published'
    RETURNING
        id,
         user_id,
        event_id,
        content AS text,
        created_at`,
      [req.user.id, eventId, commentText]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_AVAILABLE"
      });
    }

    return res.status(201).json({
      message: "EVENT_COMMENT_CREATED",
      comment: result.rows[0]
    });

  } catch (error) {
    console.error(
      "Fehler beim Erstellen des Kommentars:",
      error.message
    );

    return res.status(500).json({
      error: "EVENT_COMMENT_CREATE_FAILED"
    });
  }
}

export async function getEventComments(req, res) {
  const eventId = Number(req.params.id);

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "INVALID_EVENT_ID"
    });
  }

  try {
    const eventResult = await pool.query(
      `SELECT id
       FROM event
       WHERE id = $1
         AND status = 'published'`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_AVAILABLE"
      });
    }

    const result = await pool.query(
      `SELECT
         ec.id,
         ec.user_id,
         u.display_name,
         ec.content AS text,
         ec.created_at
       FROM event_comment AS ec
       JOIN "user" AS u ON ec.user_id = u.id
       WHERE ec.event_id = $1
       ORDER BY ec.created_at ASC, ec.id ASC`,
      [eventId]
    );

    return res.status(200).json({
      eventId,
      comments: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error(
      "Fehler beim Laden der Event-Kommentare:",
      error.message
    );

    return res.status(500).json({
      error: "EVENT_COMMENTS_FETCH_FAILED"
    });
  }
}
