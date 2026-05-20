# Feature Specification: Pflichtfelder für duale Integrationskonfiguration

**Feature Branch**: `002-fix-dual-integration`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "the specs got a bit wrong. each project has to be configured to have a youtrack project id AND a azure-devops project + repository. its not either or but both must be set"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Neues Projekt mit vollständiger Dual-Integration anlegen (Priority: P1)

Ein Administrator legt ein neues Projekt an und muss zwingend alle drei Integrationsfelder ausfüllen: YouTrack-Projekt-ID, Azure DevOps-Projekt und Azure DevOps-Repository. Das Formular lässt sich nicht absenden, solange eines der Felder leer ist.

**Why this priority**: Ohne diese Pflichtfelder liefert das Backend keine Release-Daten. Neue Projekte müssen von Anfang an vollständig konfiguriert sein.

**Independent Test**: Formular öffnen, nur YouTrack-ID eingeben, Absenden-Schaltfläche klicken → Fehlermeldungen für die zwei fehlenden Azure-Felder erscheinen. Danach alle drei Felder ausfüllen → Formular wird erfolgreich abgesendet.

**Acceptance Scenarios**:

1. **Given** Benutzer öffnet Formular für neues Projekt, **When** er nur YouTrack-Projekt-ID eingibt und absendet, **Then** erscheinen Fehlermeldungen für Azure DevOps-Projekt und Azure DevOps-Repository
2. **Given** Benutzer öffnet Formular für neues Projekt, **When** er alle drei Felder (YouTrack-ID, AzDO-Projekt, AzDO-Repository) ausfüllt und absendet, **Then** wird das Projekt erfolgreich angelegt und in der Projektliste angezeigt
3. **Given** Benutzer öffnet Formular für neues Projekt, **When** er alle drei Felder leer lässt und absendet, **Then** erscheinen Fehlermeldungen für alle drei Pflichtfelder

---

### User Story 2 - Bestehendes Projekt bearbeiten und unvollständige Konfiguration korrigieren (Priority: P2)

Ein Administrator bearbeitet ein bestehendes Projekt. Falls das Projekt vor der Umstellung nur eine der Integrationen konfiguriert hatte, muss er die fehlenden Felder ergänzen, bevor Änderungen gespeichert werden können.

**Why this priority**: Bestehende Projekte könnten nach der Datenmodell-Umstellung unvollständige Konfigurationen haben. Das Bearbeitungsformular muss dieselben Pflichtregeln durchsetzen.

**Independent Test**: Bestehendes Projekt mit fehlenden Azure-Feldern im Bearbeitungsformular öffnen → Formular zeigt leere Pflichtfelder → Speichern ohne Ausfüllen schlägt fehl → Nach Ausfüllen aller Felder wird gespeichert.

**Acceptance Scenarios**:

1. **Given** Benutzer öffnet Bearbeitungsformular eines Projekts mit fehlender Azure DevOps-Konfiguration, **When** er ohne Änderung speichert, **Then** erscheinen Fehlermeldungen für die fehlenden Pflichtfelder
2. **Given** Benutzer öffnet Bearbeitungsformular eines vollständig konfigurierten Projekts, **When** er ein Pflichtfeld leert und speichert, **Then** erscheint eine Fehlermeldung für das geleerte Feld
3. **Given** Benutzer öffnet Bearbeitungsformular eines Projekts, **When** er alle drei Integrationsfelder korrekt ausfüllt und speichert, **Then** werden die Änderungen übernommen

---

### Edge Cases

- Was passiert, wenn ein Benutzer versucht, ein Projekt mit YouTrack-ID, aber ohne AzDO-Repository (nur AzDO-Projekt) zu speichern? → Fehlermeldung nur für das fehlende AzDO-Repository-Feld
- Was passiert mit Projekten in der Datenbank, die vor der Umstellung nur eine Integration hatten? → Sie können weiterhin gelesen/angezeigt werden, aber nicht ohne vollständige Konfiguration gespeichert werden
- Was passiert bei leerem String (nur Leerzeichen) in einem Pflichtfeld? → Wird als leer behandelt, Fehlermeldung erscheint

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Jedes Projekt MUSS eine YouTrack-Projekt-ID enthalten (nicht leer, kein reiner Leerraum)
- **FR-002**: Jedes Projekt MUSS einen Azure DevOps-Projektnamen enthalten (nicht leer, kein reiner Leerraum)
- **FR-003**: Jedes Projekt MUSS einen Azure DevOps-Repository-Namen enthalten (nicht leer, kein reiner Leerraum)
- **FR-004**: Das Erstellungsformular MUSS alle drei Integrationsfelder als Pflichtfelder kennzeichnen
- **FR-005**: Das Bearbeitungsformular MUSS alle drei Integrationsfelder als Pflichtfelder kennzeichnen
- **FR-006**: Das System MUSS das Absenden verhindern und feldspezifische Fehlermeldungen anzeigen, wenn ein Pflichtfeld fehlt
- **FR-007**: Fehlermeldungen MÜSSEN innerhalb von 1 Sekunde nach dem Absenden sichtbar sein
- **FR-008**: Das Datenmodell MUSS das bisherige `source`-Feld (either/or YouTrack vs. Azure) entfernen — jedes Projekt hat immer beide Integrationen

### Key Entities

- **Project**: Repräsentiert ein Release-Management-Projekt mit Pflichtfeldern: Name, Kadenz, Versionsschema, YouTrack-Projekt-ID, Azure DevOps-Projekt, Azure DevOps-Repository

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % der neu angelegten Projekte haben alle drei Integrationsfelder ausgefüllt
- **SC-002**: Fehlermeldungen bei fehlenden Pflichtfeldern erscheinen innerhalb von 1 Sekunde nach dem Absenden
- **SC-003**: Bestehende Projekte mit unvollständiger Konfiguration können weiterhin angezeigt, aber nicht ohne Korrektur gespeichert werden
- **SC-004**: Kein Projekt kann ohne vollständige Dual-Integration-Konfiguration in der Datenbank gespeichert werden

## Assumptions

- Alle Projekte verwenden beide Integrationen (YouTrack für Tickets, Azure DevOps für Repository/Releases) — es gibt kein reines YouTrack- oder reines AzDO-Projekt
- Das bisherige `source`-Feld wird entfernt; Migration bestehender Datensätze ist manuell oder per Skript durchzuführen
- Die Credentials (Bearer-Token, PAT) werden weiterhin ausschließlich im Browser gespeichert und nicht auf dem Server persistiert
- Feldbezeichnungen und Fehlermeldungen sind auf Deutsch
- Validierung erfolgt sowohl im Frontend (sofortiges Feedback) als auch im Backend (Datenintegrität)
