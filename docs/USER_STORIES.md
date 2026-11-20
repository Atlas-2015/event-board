
# Event-Board – User Stories

## 1. Projektbeschreibung

Event-Board ist eine webbasierte Intranet-Anwendung
zur Planung, Verwaltung und Veröffentlichung von
Veranstaltungen für Auszubildende.

## 2. Muss-Anforderungen

### US-01 – Startseite
Als Besucher möchte ich eine Startseite mit
Informationen über Event-Board sehen,
damit ich den Zweck der Anwendung verstehe.

Akzeptanzkriterium:
- Die Startseite zeigt einen Einführungstext.

### US-02 – Registrierung
Als Besucher möchte ich mich mit meiner
E-Mail-Adresse und einem Passwort registrieren,
damit ich die Anwendung nutzen kann.

Akzeptanzkriterien:
- Pflichtfelder werden überprüft.
- Passwörter werden sicher gehasht gespeichert.

### US-03 – Anmeldung
Als registrierter Benutzer möchte ich mich anmelden,
damit ich geschützte Funktionen nutzen kann.

Akzeptanzkriterien:
- Gültige Zugangsdaten ermöglichen die Anmeldung.
- Geschützte API-Endpunkte benötigen ein JWT.

### US-04 – Veranstaltung erstellen
Als angemeldeter Benutzer möchte ich eine
Veranstaltung erstellen, damit ich eine Aktivität
planen kann.

Akzeptanzkriterium:
- Neue Veranstaltungen werden als Entwurf gespeichert.

### US-05 – Veranstaltung bearbeiten
Als Veranstalter möchte ich meine Veranstaltung
bearbeiten, damit ich Informationen korrigieren kann.

Akzeptanzkriterium:
- Nur der Eigentümer darf Änderungen vornehmen.

### US-06 – Veranstaltung löschen
Als Veranstalter möchte ich eigene Veranstaltungen
löschen können, damit ich nicht benötigte
Entwürfe entfernen kann.

Akzeptanzkriterium:
- Nur der Eigentümer darf eigene Entwürfe löschen.

### US-07 – Veranstaltung veröffentlichen
Als Veranstalter möchte ich eine vollständige
Veranstaltung veröffentlichen, damit andere
Benutzer sie sehen können.

Akzeptanzkriterium:
- Nur gültige und vollständige Entwürfe werden
  veröffentlicht.

### US-08 – Veranstaltungsübersicht
Als angemeldeter Benutzer möchte ich veröffentlichte
Veranstaltungen in einer Übersicht sehen,
damit ich passende Aktivitäten finden kann.

Akzeptanzkriterium:
- Titel, Kurzbeschreibung, Vorschaubild und
  Veranstalter werden angezeigt.

### US-09 – Veranstaltungsdetails
Als angemeldeter Benutzer möchte ich die Details
einer Veranstaltung öffnen, damit ich weitere
Informationen erhalten kann.

Akzeptanzkriterium:
- Langbeschreibung, Titel, Veranstalter und
  ein größeres Bild werden angezeigt.

## 3. Kann-Anforderungen

### US-10 – Teilnahme an Veranstaltungen
Als angemeldeter Benutzer möchte ich mich für
Veranstaltungen anmelden und wieder abmelden,
damit ich meine Teilnahme verwalten kann.

### US-11 – Meine Veranstaltungen
Als angemeldeter Benutzer möchte ich meine eigenen
Veranstaltungen und Anmeldungen sehen,
damit ich den Überblick behalte.

### US-12 – Benutzerprofil
Als Benutzer möchte ich mein Profil bearbeiten
und andere Profile ansehen können,
damit ich mich innerhalb der Plattform
präsentieren kann.

## 4. Zusätzliche Funktionen

### US-13 – Like und Dislike
Als angemeldeter Benutzer möchte ich auf
Veranstaltungen reagieren können,
damit ich meine Meinung ausdrücken kann.

### US-14 – Kommentare
Als angemeldeter Benutzer möchte ich Kommentare
zu Veranstaltungen schreiben und lesen,
damit ich mich mit anderen austauschen kann.

## 5. Priorisierung

MUSS:
US-01 bis US-09

KANN:
US-10 bis US-12

ZUSATZ:
US-13 und US-14
