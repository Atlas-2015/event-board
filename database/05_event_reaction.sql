
-- ============================================
-- Event-Board
-- Tabelle: event_reaction
-- Verwaltung von Likes und Dislikes
-- ============================================

CREATE TABLE event_reaction (

    -- Primaerschluessel
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Fremdschluessel
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,

    -- Art der Reaktion
    reaction VARCHAR(7) NOT NULL,

    -- Zeitstempel
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Beziehung zur Tabelle user
    CONSTRAINT fk_reaction_user
        FOREIGN KEY (user_id)
        REFERENCES "user"(id)
        ON DELETE CASCADE,

    -- Beziehung zur Tabelle event
    CONSTRAINT fk_reaction_event
        FOREIGN KEY (event_id)
        REFERENCES event(id)
        ON DELETE CASCADE,

    -- Nur Like oder Dislike erlauben
    CONSTRAINT chk_reaction_type
        CHECK (reaction IN ('like', 'dislike')),

    -- Nur eine aktive Reaktion pro Benutzer und Event
    CONSTRAINT uq_reaction_user_event
        UNIQUE (user_id, event_id)
);
