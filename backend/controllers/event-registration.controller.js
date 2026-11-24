import pool from "../db.js";

export async function registerForEvent(req, res) {
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
         AND status = 'published'
         AND starts_at > NOW()`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_AVAILABLE"
      });
    }

    // Mehrfachanmeldungen für dasselbe Event verhindern.
    const result = await pool.query(
      `INSERT INTO event_registration (user_id, event_id)
       SELECT $1, id
       FROM event
       WHERE id = $2
         AND status = 'published'
         AND starts_at > NOW()
       ON CONFLICT (user_id, event_id) DO NOTHING
       RETURNING id, user_id, event_id, registered_at`,
      [req.user.id, eventId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        error: "EVENT_REGISTRATION_NOT_POSSIBLE"
      });
    }

    return res.status(201).json({
      message: "EVENT_REGISTRATION_SUCCESS",
      registration: result.rows[0]
    });

  } catch (error) {
    console.error("Fehler bei der Event-Anmeldung:", error.message);

    return res.status(500).json({
      error: "EVENT_REGISTRATION_FAILED"
    });
  }
}

export async function unregisterFromEvent(req, res) {
  const eventId = Number(req.params.id);

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "INVALID_EVENT_ID"
    });
  }

  try {
    // Nur die eigene Event-Anmeldung kann entfernt werden.
    const result = await pool.query(
      `DELETE FROM event_registration
       WHERE event_id = $1
         AND user_id = $2
       RETURNING id, user_id, event_id`,
      [eventId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_REGISTRATION_NOT_FOUND"
      });
    }

    return res.status(200).json({
      message: "EVENT_UNREGISTERED",
      registration: result.rows[0]
    });

  } catch (error) {
    console.error("Fehler bei der Event-Abmeldung:", error.message);

    return res.status(500).json({
      error: "EVENT_UNREGISTER_FAILED"
    });
  }
}

export async function getEventParticipants(req, res) {
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
         AND user_id = $2
         AND status = 'published'`,
      [eventId, req.user.id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        error: "EVENT_NOT_FOUND"
      });
    }

    const result = await pool.query(
      `SELECT
         u.display_name,
         er.registered_at
       FROM event_registration AS er
       JOIN "user" AS u ON er.user_id = u.id
       WHERE er.event_id = $1
       ORDER BY er.registered_at ASC`,
      [eventId]
    );

    return res.status(200).json({
      eventId,
      participants: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error("Fehler beim Laden der Teilnehmer:", error.message);

    return res.status(500).json({
      error: "PARTICIPANTS_FETCH_FAILED"
    });
  }
}

export async function getMyRegistrations(req, res) {
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
         e.status,
         er.registered_at
       FROM event_registration AS er
       JOIN event AS e ON er.event_id = e.id
       WHERE er.user_id = $1
       ORDER BY e.starts_at ASC`,
      [req.user.id]
    );

    return res.status(200).json({
      events: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error(
      "Fehler beim Laden eigener Anmeldungen:",
      error.message
    );

    return res.status(500).json({
      error: "MY_REGISTRATIONS_FETCH_FAILED"
    });
  }
}
