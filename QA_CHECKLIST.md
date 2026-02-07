# QA Checklist

## Automated Checks (Run)
- Backend tests: `backend/mvnw.cmd test`
  - Expected: `BUILD SUCCESS`, all tests pass.
- Frontend lint: `frontend/npm run lint`
  - Expected: 0 lint errors.
- Frontend test (type-check): `frontend/npm run test`
  - Expected: TypeScript passes.
- Frontend build: `frontend/npm run build`
  - Expected: Build completes without errors.

## Latest Automated Results (2026-02-07)
- Backend tests: `BUILD SUCCESS` (all tests passed).
- Frontend lint: passed.
- Frontend test (type-check): passed.
- Frontend build: passed.
- Notes: Vite build warns about large chunk size; Flyway warns about H2 version compatibility.

## Backend Functional Checks (Manual)
1. OpenAPI
   - Start backend: `backend/mvnw.cmd spring-boot:run`
   - Visit `http://localhost:8080/swagger-ui/index.html`
   - Expected: Swagger UI loads and lists endpoints.
   - API JSON: `http://localhost:8080/v3/api-docs` returns 200.

2. RBAC
   - Without token:
     - `curl -i http://localhost:8080/api/trainings`
     - Expected: `401 Unauthorized`.
   - Wrong role (FORMATEUR tries to create training):
     - `POST /api/trainings` with FORMATEUR token
     - Expected: `403 Forbidden`.

3. Flyway on Fresh DB
   - Fresh DB + run backend (or use H2 in tests): migrations apply with no errors.
   - Expected: schema created, V3/V4 applied.

4. Mistral Setup (Manual)
   - Set env var: `MISTRAL_API_KEY=...`
   - Verify config in `backend/src/main/resources/application.yml`.
   - Optional stub mode: `MISTRAL_STUB_ENABLED=true`.
   - Example curl (manual verification):
```bash
curl https://api.mistral.ai/v1/chat/completions \
  -X POST \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral-large-latest",
    "messages": [
      { "role": "system", "content": "You generate training plans for ASTBA. Output MUST be valid JSON that conforms exactly to the JSON Schema provided in response_format. Output JSON ONLY. Do not include extra keys. Exactly 4 levels and 6 sessions per level. If date unknown set startAt null." },
      { "role": "user", "content": "USER_DESCRIPTION: ...\\nCONSTRAINTS_JSON: ...\\nLANGUAGE: fr" }
    ],
    "temperature": 0.2,
    "max_tokens": 2500,
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "astba_ai_training_plan_v1",
        "schema": { "type": "object" }
      }
    }
  }'
```

## Frontend Functional Checks (Manual)
1. No console errors on `/trainings/new` and `/trainings/:id` when loading data.
2. Mobile responsive layout:
   - Training detail page sessions/cards stack on small widths.
   - Attendance page remains readable and operable.

## Accessibility Manual Checks
- Keyboard-only flows:
  - Create training (AUTO + MANUAL).
  - Generate structure / manual build.
  - Edit session schedule.
  - Apply AI plan.
  - Enroll student.
  - Take attendance.
- Focus visible on all controls.
- Dialogs trap focus; `Esc` closes; focus returns to trigger.

## End-to-End Demo (Manual)
- RESPONSABLE creates AUTO training -> AI Assist -> Apply plan -> sessions scheduled.
- RESPONSABLE creates MANUAL training -> build structure -> schedule sessions.
- FORMATEUR takes attendance.
- Progress endpoint shows eligibility.
- Certificate generated and downloadable.
