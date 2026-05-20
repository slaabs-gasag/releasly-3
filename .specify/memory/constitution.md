<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0
All placeholders replaced; first concrete constitution.

Modified principles:
  [PRINCIPLE_1_NAME] → I. Automation-First
  [PRINCIPLE_2_NAME] → II. Zero-Config Defaults
  [PRINCIPLE_3_NAME] → III. Progressive Disclosure
  [PRINCIPLE_4_NAME] → IV. Reliability & Observability
  [PRINCIPLE_5_NAME] → V. Test-Driven Automation

Added sections:
  - Technical Standards
  - Development Workflow

Removed sections: none

Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check placeholder correct;
     filled per-feature by /speckit-plan
  ✅ .specify/templates/spec-template.md — no constitution-specific constraints needed
  ✅ .specify/templates/tasks-template.md — phases align with principles; no changes required

Follow-up TODOs: none — all placeholders resolved
-->

# Releasly Constitution

## Core Principles

### I. Automation-First

Every workflow MUST require zero user intervention by default. Actions that can be
inferred from context MUST be automated without prompting. Any manual step introduced
in a feature MUST be explicitly justified in its specification with a documented reason
why automation is not feasible.

Automated decisions MUST be logged so users can understand what happened and why.
Automation MUST NOT silently discard data or skip steps — failures surface, but
intervention is only requested when genuinely required.

### II. Zero-Config Defaults

Features MUST work out of the box with no configuration required. Configuration
options are ONLY introduced when no universally sensible default exists. All defaults
MUST be production-safe and appropriate for a first-time user with no prior knowledge
of the system.

When a configuration option is added, its absence MUST never cause a crash or
degraded experience — the default MUST always be a valid, safe choice.

### III. Progressive Disclosure

The UI and API MUST surface only what is necessary for the current context. Advanced
options and edge-case controls MUST be hidden unless explicitly requested by the user.
Error messages MUST suggest the next concrete action, not merely describe the failure.

Complexity is hidden, not eliminated. Every advanced capability MUST remain accessible,
but it MUST NOT be presented to users who have not opted into it.

### IV. Reliability & Observability

All automated flows MUST produce structured logs capturing: what action was taken,
what inputs were used, and what the outcome was. This information MUST be sufficient
to diagnose any failure without additional user input.

Automated retries MUST be implemented for all transient failure modes. When automation
cannot recover, it MUST halt and surface a specific, actionable error — not a generic
message. Silent failures are not acceptable.

### V. Test-Driven Automation

All automation logic MUST have integration tests written before implementation begins.
Tests MUST cover real-world inputs including malformed data, empty states, and
concurrent invocations. Happy-path-only test coverage is insufficient — automation
amplifies edge-case failures at scale.

Tests MUST fail before implementation begins (red phase enforced). No automated
feature ships without a passing integration test suite.

## Technical Standards

All API endpoints MUST follow a consistent request/response schema. Breaking changes
to any public API MUST increment the major version. Internal APIs between services
follow the same discipline.

Performance: automated flows MUST complete within user-perceivable time limits or
provide async feedback with progress indication. Synchronous operations blocking the
UI for more than 500ms MUST be moved to background jobs.

Dependencies MUST be kept minimal. Each new dependency requires justification in
the PR — what problem it solves and why existing code cannot address it.

## Development Workflow

Every feature starts with a specification (`/speckit-specify`). No implementation
begins without an approved spec. The spec MUST explicitly state which automated
behaviors are introduced and how failures are surfaced.

PRs MUST pass all integration tests before merge. Constitution compliance is verified
during plan review (`/speckit-plan` Constitution Check gate). Features that introduce
manual steps without documented justification MUST NOT be merged.

All automation-critical paths MUST include at least one end-to-end integration test
simulating the automated flow from trigger to outcome.

## Governance

This constitution supersedes all other development guidance. Amendments require:
1. A documented rationale explaining the change.
2. An updated version number per semantic versioning rules below.
3. Propagation of any impacted constraints to spec, plan, and task templates.

Versioning policy:
- **MAJOR**: Principle removed, redefined, or made incompatible with prior interpretation.
- **MINOR**: New principle or section added; existing guidance materially expanded.
- **PATCH**: Clarifications, wording improvements, typo fixes.

Compliance review occurs during each feature's plan phase (Constitution Check gate).
Any violation MUST be justified in the Complexity Tracking table of the plan, or the
principle MUST be amended before implementation proceeds.

**Version**: 1.0.0 | **Ratified**: 2026-05-20 | **Last Amended**: 2026-05-20
