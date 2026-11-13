
-- ============================================
-- Event-Board
-- Tabelle: event_comment
-- Verwaltung der Veranstaltungskommentare
-- ============================================

CREATE TABLE event_comment (

    -- Primaerschluessel
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Fremdschluessel
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,

    -- Kommentartext (maximal 500 Zeichen)
    content VARCHAR(500) NOT NULL,

    -- Zeitpunkt der Erstellung
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Beziehung zur Tabelle user
    CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id)
        REFERENCES "user"(id)
        ON DELETE CASCADE,

    -- Beziehung zur Tabelle event
    CONSTRAINT fk_comment_event
        FOREIGN KEY (event_id)
        REFERENCES event(id)
        ON DELETE CASCADE,

    -- Leere Kommentare und reine Leerzeichen verhindern
    CONSTRAINT chk_comment_content
        CHECK (content ~ '[^[:space:]]')
);
