# Feature Specification: Internal Release Management Dashboard

**Feature Branch**: `001-release-management`

**Created**: 2026-05-20
**Amended**: 2026-05-20 — updated auth model (per-user localStorage tokens), storage
(PostgreSQL), and project management.
**Amended**: 2026-05-20 — added Azure Entra ID authentication; dev-only login bypass.

**Status**: Draft

**Input**: User description — initial: "complete tool for internal release management,
shows all configured apps, version, release-cycle, naming conventions (semver or
yyyymmdd.[number]), release notes, works with YouTrack and Azure DevOps via API, has
charts and nice UI." — amended: "access tokens stored per-user in localStorage; each
user sets their own PAT (DevOps) or bearer token (YouTrack); user also sets YouTrack URL
and DevOps base URL; projects define the YouTrack Project ID and Azure DevOps project +
repository; everything else stored in PostgreSQL; DB connection string from .env." —
amended: "user authenticates via Azure Entra ID; local development can use a dev-only
login button."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In (Priority: P1)

A user opens Releasly and is required to sign in with their organizational account before
accessing any content. In production, sign-in is handled through the company's identity
provider. In a local development environment, a clearly marked "Dev Login" button allows
developers to skip the identity provider flow entirely and access the app immediately.

**Why this priority**: Authentication is a prerequisite to all other stories. No content
is accessible without a valid session.

**Independent Test**: Open the app without an active session. A sign-in screen appears.
Click the organizational sign-in button. After authenticating, the user is redirected to
the dashboard. In a local development environment, the "Dev Login" button achieves the
same result without identity provider interaction.

**Acceptance Scenarios**:

1. **Given** the user has no active session, **When** they open the app, **Then** a
   sign-in screen is shown and no app content is visible.
2. **Given** the user clicks the organizational sign-in button, **When** authentication
   succeeds, **Then** they are redirected to the dashboard.
3. **Given** authentication fails or is cancelled, **When** control returns to the app,
   **Then** the sign-in screen is shown again with a clear error message.
4. **Given** the app is running in local development mode, **When** the user clicks the
   "Dev Login" button, **Then** they are signed in immediately without identity provider
   interaction.
5. **Given** the user has an active session, **When** they return to the app, **Then**
   they are taken directly to the dashboard without re-authenticating.
6. **Given** the user's session expires, **When** they perform any action, **Then** they
   are redirected to the sign-in screen and returned to their previous page after login.

---

### User Story 2 - First-Time Integration Credential Setup (Priority: P1)

After signing in for the first time, the user is prompted to enter their personal YouTrack
bearer token and base URL, and their Azure DevOps organization URL and Personal Access
Token. These credentials are saved in the browser and never transmitted to the server.
Once saved, the dashboard becomes fully functional.

**Why this priority**: Without integration credentials, no release data can be fetched.
This is a prerequisite for the portfolio view. Tokens are personal — each user manages
their own.

**Independent Test**: After signing in with no integration credentials stored, a setup
prompt appears. Fill in YouTrack URL + token and Azure DevOps URL + PAT and save. The
dashboard loads showing configured projects.

**Acceptance Scenarios**:

1. **Given** a signed-in user has no integration credentials in their browser, **When**
   they open the dashboard, **Then** an integration credential setup prompt is shown.
2. **Given** the user enters a YouTrack bearer token and base URL and saves, **Then** the
   credentials are stored only in their browser; nothing is sent to the application server.
3. **Given** a user saves integration credentials, **When** they return in a new browser
   session, **Then** the credentials are restored from browser storage without re-entry.
4. **Given** integration credentials become invalid, **When** a data fetch fails due to
   auth rejection, **Then** a specific error prompts the user to update credentials in
   settings (not a generic error page).

---

### User Story 3 - App Portfolio Overview (Priority: P2)

A team lead opens Releasly and immediately sees every configured project on a single
dashboard: current version, release cycle, last release date, and integration source
(YouTrack or Azure DevOps). The dashboard loads automatically once credentials are
configured; no further setup is required.

**Why this priority**: Core value view. Every other story builds on this.

**Independent Test**: With credentials configured and at least one project in the
database, the dashboard MUST display that project's current version and last release
within 3 seconds, without any user action beyond opening the app.

**Acceptance Scenarios**:

1. **Given** credentials are configured and projects exist in the database, **When** the
   user navigates to the dashboard, **Then** all projects are listed with current version,
   release cycle label, last release date, and integration source badge.
2. **Given** a project has not had a release in longer than its configured release cycle,
   **When** the dashboard loads, **Then** that project is visually flagged as overdue.
3. **Given** an integration source is unreachable, **When** the dashboard loads, **Then**
   the affected project shows its last known data with a staleness indicator instead of
   an error page.
4. **Given** no projects are configured, **When** the dashboard loads, **Then** an empty
   state with instructions to add the first project is shown.

---

### User Story 4 - Release History & Notes (Priority: P3)

A developer clicks on any project in the dashboard to see its complete release history
with full release notes for each version, in reverse chronological order.

**Why this priority**: Release notes are the primary artifact of a release process.
Requires the portfolio view to be working.

**Independent Test**: Click a project card. A detail page MUST show at least 10 releases
with version labels and release notes fetched from the integration source.

**Acceptance Scenarios**:

1. **Given** a user is on the dashboard, **When** they click on a project, **Then** they
   are taken to a detail page showing all historical releases in reverse chronological
   order.
2. **Given** a project uses semver naming, **When** its release history is shown, **Then**
   version labels follow the MAJOR.MINOR.PATCH format.
3. **Given** a project uses date-based naming, **When** its release history is shown,
   **Then** version labels follow the YYYYMMDD.[sequence] format.
4. **Given** release notes exist in the integration source, **When** a release is
   expanded, **Then** the full release notes are displayed with markdown rendered.
5. **Given** a release has no notes, **When** it is shown, **Then** a "No release notes
   provided" message is displayed rather than an empty area.

---

### User Story 5 - Project Management (Priority: P3)

An admin adds a new project to the dashboard via the UI. They specify the project name,
integration source, the YouTrack project ID or Azure DevOps project + repository, release
naming convention, and target release cycle. The project is saved to the database and
immediately appears in the portfolio.

**Why this priority**: Required for ongoing operation as new apps are added. Depends on
the portfolio view existing.

**Independent Test**: Open the "Add Project" form. Fill in a valid YouTrack project ID
and settings. Submit. The new project card appears on the dashboard.

**Acceptance Scenarios**:

1. **Given** a user is on the dashboard, **When** they click "Add Project", **Then** a
   form appears with fields for name, source, project/repo identifiers, naming convention,
   and release cycle.
2. **Given** a user submits a valid project, **When** saved, **Then** the project is
   persisted to the database and appears on the dashboard without a page reload.
3. **Given** a user submits invalid or missing fields, **When** they submit, **Then**
   inline validation errors appear on the specific fields.
4. **Given** a project exists, **When** the user opens its settings, **Then** they can
   edit all fields or delete the project.

---

### User Story 6 - Release Analytics Charts (Priority: P4)

A manager views charts showing release frequency over time per project, average time
between releases, and which projects are on track versus overdue. Charts render on the
dashboard automatically from existing data.

**Why this priority**: Insights layer. Requires sufficient release data to be meaningful.

**Independent Test**: With multiple projects having multiple releases, the dashboard MUST
show at least one chart displaying release frequency over time without additional user
setup.

**Acceptance Scenarios**:

1. **Given** projects have release history data, **When** the dashboard loads, **Then** a
   chart displays release frequency per project over the last 90 days.
2. **Given** a project has a configured release cycle, **When** shown in the chart,
   **Then** actual cadence is visually compared against the configured cycle target.
3. **Given** the user hovers a data point, **When** the tooltip appears, **Then** it
   shows the release version, date, and project name.

---

### Edge Cases

- What if the user is not part of the authorized organization? Sign-in fails and a clear
  "Access denied — contact your administrator" message is shown.
- What if the user's session expires mid-session? They are redirected to sign in again
  and returned to their previous page afterward.
- What if integration credentials are set but invalid? Dashboard shows a specific
  credential error with a direct link to the settings page.
- What if only YouTrack is configured (no Azure DevOps credentials)? Azure DevOps
  projects show an "Authentication required" state; YouTrack projects load normally.
- What if the database is unreachable? The app shows a clear server error — projects
  cannot load without the database.
- What if both integration sources are unreachable simultaneously? Each project card
  shows its last cached state with a staleness timestamp.
- What if a release version doesn't match the configured naming convention? Displayed
  as-is with a warning indicator; not hidden.
- What if a user clears their browser storage? They remain signed in (session is
  server-side) but must re-enter integration credentials on next credential use.
- What if the "Dev Login" button is used in a production deployment? It MUST NOT be
  accessible; it is shown only when the app is running in development mode.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require users to authenticate before accessing any content.
  Unauthenticated requests MUST be redirected to the sign-in screen.
- **FR-002**: System MUST support organizational sign-in through the company identity
  provider in production deployments.
- **FR-003**: System MUST provide a clearly marked "Dev Login" button that bypasses
  identity provider sign-in, visible and functional ONLY in local development mode. This
  button MUST NOT be accessible in production.
- **FR-004**: System MUST maintain user sessions so that returning users are not required
  to re-authenticate unless their session has expired.
- **FR-005**: System MUST display all projects stored in the database on the main
  dashboard with current version, last release date, release cycle, and integration
  source badge.
- **FR-006**: System MUST use the user's locally stored integration credentials (YouTrack
  bearer token, Azure DevOps PAT) to fetch release data; credentials MUST NOT be stored
  on the application server.
- **FR-007**: System MUST support two release naming conventions per project: semver
  (MAJOR.MINOR.PATCH) and date-based (YYYYMMDD.[sequence]).
- **FR-008**: System MUST display full release notes for each release in the project
  detail view, rendered from markdown when available.
- **FR-009**: System MUST show release frequency charts computed from release data on
  the main dashboard, with no additional user configuration.
- **FR-010**: System MUST surface a clear visual indicator when a project's last release
  exceeds its configured release cycle.
- **FR-011**: System MUST show last known cached state with a staleness indicator when
  an integration source is unreachable, rather than showing an error page.
- **FR-012**: System MUST load the main dashboard within 3 seconds on a local network
  once the user is signed in and integration credentials are configured.
- **FR-013**: Users MUST be able to add, edit, and delete projects through the UI;
  changes MUST persist to the database without restarting the application.
- **FR-014**: System MUST provide a settings screen where users can configure their
  YouTrack base URL, YouTrack bearer token, Azure DevOps organization URL, and Azure
  DevOps PAT; these MUST be stored only in the user's browser.
- **FR-015**: System MUST prompt signed-in users who have not yet configured integration
  credentials to do so before showing the dashboard.
- **FR-016**: Each project MUST specify: display name, integration source (YouTrack or
  Azure DevOps), project/repository identifier in the source, release naming convention,
  and target release cycle in days.

### Key Entities

- **AuthenticatedUser** (session, server-side): The signed-in user's identity as
  established by the organizational identity provider or dev login. Attributes: user
  identifier, display name, email. Session maintained server-side; no credentials
  stored.
- **UserSettings** (browser-local, not persisted server-side): YouTrack base URL,
  YouTrack bearer token, Azure DevOps organization URL, Azure DevOps PAT. Stored in
  browser localStorage. Never transmitted to server storage.
- **Project** (persisted in PostgreSQL): Unique identifier, display name, integration
  source (YouTrack or Azure DevOps), project identifier in the source (YouTrack project
  ID or Azure DevOps project + repository slug), release naming convention, target release
  cycle in days.
- **Release** (fetched live from integration source, optionally cached): Version string,
  release date, release notes (markdown), parent project reference.
- **CachedRelease** (persisted in PostgreSQL for staleness fallback): A copy of the
  last-known Release data per project, with a cache timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard displays all configured projects within 3 seconds of page load
  when the user is signed in and integration credentials are already configured.
- **SC-002**: A first-time user can sign in and configure integration credentials and
  see their first project's release data within 5 minutes of opening the app.
- **SC-003**: Release notes for any project are reachable within 2 clicks from the
  dashboard.
- **SC-004**: All projects whose last release exceeds their configured cycle are
  automatically flagged without any user action.
- **SC-005**: When an integration source is unavailable, the app continues to show last
  known data rather than an error screen.
- **SC-006**: A new project can be added to the dashboard entirely through the UI,
  with no changes to server configuration or code.

## Assumptions

- Target users are internal engineers and team leads. All users have organizational
  accounts eligible for identity provider sign-in.
- The application runs on an internal server accessible via browser on a local network.
- The "Dev Login" button is controlled by a build-time or environment-level flag; it
  cannot be enabled in production by a user.
- Each user uses their own personal YouTrack bearer token and Azure DevOps PAT — there
  is no shared service account token.
- Only read access to YouTrack and Azure DevOps is required; no writes.
- Integration credentials stored in browser localStorage are acceptable for this internal
  tool; no enterprise credential vault is required in v1.
- A small number of projects are configured (under 100); no pagination required in v1.
- All users share the same PostgreSQL database (projects visible to all signed-in users).
- Chart data is computed from cached release data already in the database; no separate
  analytics service is needed.
- Session management uses standard server-side sessions; session duration is reasonable
  for an internal workday tool (e.g., 8 hours idle timeout).
