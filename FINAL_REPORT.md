# ASTBA Formation Creation Mode (AUTO/MANUAL) — Final Report

## Summary
- Added `creationMode` (AUTO/MANUAL) and `structureStatus` to trainings, plus session scheduling fields (`startAt`, `durationMin`, `location`, `status`) and level?session linkage.
- Implemented structure endpoints with mode enforcement, structure locking, and audit logging.
- Added AI-assisted planning for AUTO mode with JSON Schema validation, Mistral integration, rate limiting, and human-in-the-loop apply.
- Added Flyway baseline migration (V1) and AI plan fields migration (V4).
- Updated frontend training flows with `/trainings/new`, `/trainings/:id`, and AI Assist panel.
## Key Backend Changes
- New enums: `TrainingCreationMode`, `TrainingStructureStatus`.
- Structure generation logic in `TrainingStructureService` with attendance lock checks.
- New/updated endpoints:
  - `POST /api/trainings` (RESPONSABLE)
  - `POST /api/trainings/{id}/generate-structure` (AUTO only)
  - `POST /api/trainings/{id}/levels` (MANUAL only)
  - `POST /api/levels/{levelId}/sessions` (MANUAL only)
  - `PUT /api/sessions/{sessionId}` (schedule update)
  - `GET /api/trainings/{id}` (training + levels + sessions)
- Added Flyway migration `V1__init_schema.sql` for baseline schema.
- Added Flyway migration `V3__training_creation_mode_structure.sql`.
- Added Flyway migration `V4__ai_plan_fields.sql` for AI plan fields.
- Added AI schema validation + Mistral client (stub option) and endpoints:
  - `POST /api/trainings/{id}/ai-plan`
  - `POST /api/trainings/{id}/apply-ai-plan`
- Added API error handler returning 409 on unique constraint conflicts.
## Key Frontend Changes
- Role names aligned to `ADMIN`, `RESPONSABLE`, `FORMATEUR`.
- Training creation form sends `title`, `creationMode`, fixed structure counts (4/6).
- Added `/trainings/new` and `/trainings/:id` detail pages.
- Added AI Assist panel with editable draft + Apply gate (AUTO only).
- Updated session date/duration handling to `startAt`/`durationMin`.
## Tests & Builds
- Backend tests: `./mvnw.cmd test`
- Frontend lint: `npm run lint`
- Frontend test (type-check): `npm run test`
- Frontend build: `npm run build`
## Mistral Setup
- Set `MISTRAL_API_KEY` in the backend environment.
- Config lives in `backend/src/main/resources/application.yml` under `llm.mistral`.
- Optional stub mode: set `MISTRAL_STUB_ENABLED=true`.
## Latest Test Results (2026-02-07)
- All automated checks passed.
- Warnings observed: Vite chunk size warning on build; Flyway warns about H2 version compatibility.
## Notes / Decisions
- Structure generation is **idempotent**: calling generate again returns current structure.
- Structure changes are **blocked** when attendance exists (409 `STRUCTURE_LOCKED`).
- Scheduling updates are still allowed when locked.

## Files Added/Updated (Highlights)
- `backend/src/main/java/com/astba/backend/entity/Training.java`
- `backend/src/main/java/com/astba/backend/entity/Session.java`
- `backend/src/main/java/com/astba/backend/service/TrainingStructureService.java`
- `backend/src/main/java/com/astba/backend/controller/TrainingController.java`
- `backend/src/main/resources/db/migration/V3__training_creation_mode_structure.sql`
- `frontend/src/pages/trainings/page.tsx`
- `frontend/src/components/feature/Navbar.tsx`
- `frontend/src/router/config.tsx`
