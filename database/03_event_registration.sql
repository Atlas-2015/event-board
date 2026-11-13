
-- ============================================
-- Event-Board
-- Tabelle: event_registration
-- Verwaltung der Veranstaltungsanmeldungen
-- ============================================

CREATE TABLE event_registration (

    -- Primaerschluessel
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Fremdschluessel
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,

    -- Zeitpunkt der Anmeldung
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Beziehung zur Tabelle user
    CONSTRAINT fk_registration_user
        FOREIGN KEY (user_id)
        REFERENCES "user"(id)
        ON DELETE CASCADE,

    -- Beziehung zur Tabelle event
    CONSTRAINT fk_registration_event
        FOREIGN KEY (event_id)
        REFERENCES event(id)
        ON DELETE CASCADE,

    -- Keine doppelte Anmeldung zum selben Event
    CONSTRAINT uq_registration_user_event
        UNIQUE (user_id, event_id)
);
