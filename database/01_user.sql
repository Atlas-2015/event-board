
-- Event-Board
-- Tabelle: user
-- Speicherung der Benutzerdaten und Zugriffsrollen

CREATE TABLE "user" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    display_name VARCHAR(60) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,

    profile_image_path TEXT,

    role VARCHAR(10) NOT NULL DEFAULT 'user',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Anzeigename und E-Mail dürfen nicht leer sein
    CONSTRAINT chk_user_display_name
        CHECK (BTRIM(display_name) <> ''),

    CONSTRAINT chk_user_email
        CHECK (BTRIM(email) <> ''),

    -- Nur zwei Benutzerrollen sind erlaubt
    CONSTRAINT chk_user_role
        CHECK (role IN ('user', 'admin'))
);

-- E-Mail-Adressen müssen unabhängig von Groß- und
-- Kleinschreibung eindeutig sein
CREATE UNIQUE INDEX idx_user_email_lower
    ON "user" (LOWER(email));
