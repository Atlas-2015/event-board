import pool from "../db.js";

export async function setEventReaction(req, res) {
  const eventId = Number(req.params.id);
  const { reaction } = req.body ?? {};

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "INVALID_EVENT_ID"
    });
  }

  if (reaction !== "like" && reaction !== "dislike") {
    return res.status(400).json({
      error: "INVALID_REACTION"
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO event_reaction (user_id, event_id, reaction)
       SELECT $1, id, $3
       FROM event
       WHERE id = $2
         AND status = 'published'
       ON CONFLICT (user_id, event_id)
       DO UPDATE SET
         reaction = EXCLUDED.reaction,
         updated_at = NOW()
       RETURNING id, user_id, event_id, reaction`,
      [req.user.id, eventId, reaction]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_AVAILABLE"
      });
    }

    return res.status(200).json({
      message: "EVENT_REACTION_SAVED",
      reaction: result.rows[0]
    });

  } catch (error) {
    console.error("Fehler bei der Event-Reaktion:", error.message);

    return res.status(500).json({
      error: "EVENT_REACTION_FAILED"
    });
  }
}

export async function getEventReactionCounts(req, res) {
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
         COUNT(er.id) FILTER (
           WHERE er.reaction = 'like'
         )::integer AS likes,
         COUNT(er.id) FILTER (
           WHERE er.reaction = 'dislike'
         )::integer AS dislikes,
          MAX(er.reaction) FILTER (WHERE er.user_id = $2) AS my_reaction

       FROM event AS e
       LEFT JOIN event_reaction AS er
         ON er.event_id = e.id
       WHERE e.id = $1
         AND e.status = 'published'
       GROUP BY e.id`,
      [eventId,req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_AVAILABLE"
      });
    }

    return res.status(200).json({
      eventId,
      likes: result.rows[0].likes,
      dislikes: result.rows[0].dislikes,
      myReaction: result.rows[0].my_reaction,
    });

  } catch (error) {
    console.error(
      "Fehler beim Laden der Event-Reaktionen:",
      error.message
    );

    return res.status(500).json({
      error: "EVENT_REACTIONS_FETCH_FAILED"
    });
  }
}

export async function removeEventReaction(req, res) {
  const eventId = Number(req.params.id);

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "INVALID_EVENT_ID"
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM event_reaction
       WHERE event_id = $1
         AND user_id = $2
       RETURNING id, event_id, reaction`,
      [eventId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_REACTION_NOT_FOUND"
      });
    }

    return res.status(200).json({
      message: "EVENT_REACTION_REMOVED",
      reaction: result.rows[0]
    });

  } catch (error) {
    console.error(
      "Fehler beim Entfernen der Event-Reaktion:",
      error.message
    );

    return res.status(500).json({
      error: "EVENT_REACTION_REMOVE_FAILED"
    });
  }
}
