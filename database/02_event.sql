
-- ============================================
-- Event-Board
-- Tabelle: event
-- Speicherung und Verwaltung von Veranstaltungen
-- ============================================

CREATE TABLE event (

    -- Primaerschluessel
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Veranstalter
    user_id BIGINT NOT NULL,

    -- Veranstaltungsinformationen
    title VARCHAR(100) NOT NULL,
    short_description VARCHAR(200),
    full_description TEXT,
    category VARCHAR(32),

    -- Datum und Uhrzeit
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,

    -- Veranstaltungsort und Bild
    location VARCHAR(255),
    image_path TEXT,

    -- Status und Zeitstempel
    status VARCHAR(12) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Beziehung zur Tabelle user
    CONSTRAINT fk_event_user
        FOREIGN KEY (user_id)
        REFERENCES "user"(id)
        ON DELETE RESTRICT,

    -- Titel darf nicht leer sein
    CONSTRAINT chk_event_title
        CHECK (BTRIM(title) <> ''),

    -- Maximale Laenge der Beschreibung
    CONSTRAINT chk_event_description_length
        CHECK (
            full_description IS NULL
            OR CHAR_LENGTH(full_description) <= 3000
        ),

    -- Zulaessige Kategorien
    CONSTRAINT chk_event_category
        CHECK (
            category IS NULL
            OR category IN (
                'workshops',
                'technology',
                'team',
                'personal',
                'sports',
                'trips',
                'culture',
                'other'
            )
        ),

    -- Zulaessige Statuswerte
    CONSTRAINT chk_event_status
        CHECK (status IN ('draft', 'published')),

    -- Endzeit muss nach der Startzeit liegen
    CONSTRAINT chk_event_time
        CHECK (
            ends_at IS NULL
            OR (
                starts_at IS NOT NULL
                AND ends_at > starts_at
            )
        ),

    -- Pflichtfelder bei veroeffentlichten Events
    CONSTRAINT chk_event_publish
        CHECK (
            status = 'draft'
            OR (
                NULLIF(BTRIM(short_description), '') IS NOT NULL
                AND NULLIF(BTRIM(full_description), '') IS NOT NULL
                AND category IS NOT NULL
                AND starts_at IS NOT NULL
                AND NULLIF(BTRIM(location), '') IS NOT NULL
                AND NULLIF(BTRIM(image_path), '') IS NOT NULL
            )
        )
);
