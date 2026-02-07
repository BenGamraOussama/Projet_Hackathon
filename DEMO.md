# DEMO — Formation Creation Mode (AUTO/MANUAL)

## Demo accounts
- RESPONSABLE: responsable@astba.tn / demo123
- FORMATEUR: formateur@astba.tn / demo123
- ADMIN: admin@astba.tn / demo123

## UI demo (React)
1. Login as `RESPONSABLE` and go to `/trainings/new`.
2. Create an AUTO formation (title + AUTO). You are redirected to `/trainings/:id`.
3. Click “Generate structure”, confirm in the dialog.
4. Expand a level accordion and edit a session schedule (startAt, duration, location, status).
5. Create a MANUAL formation from `/trainings/new` and open `/trainings/:id`.
6. Use “Create level 1..4” then “Create session 1..6” per level, then edit schedules.
7. On an AUTO formation, open the AI Assist panel, generate a draft, edit a few fields, then click Apply.


## Click-by-click Demo
1. Login as RESPONSABLE.
2. Go to `/trainings/new` and create an AUTO formation.
3. You are redirected to `/trainings/:id`.
4. Open AI Assist, generate a draft, edit a few fields, click Apply.
5. Click Generate structure if still available (AUTO).
6. Expand a level accordion and edit a session schedule.
7. Create a MANUAL formation from `/trainings/new`.
8. In `/trainings/:id`, create levels 1..4 then sessions 1..6 per level.
9. Schedule sessions with startAt, duration, location, status.
10. Enroll a student from `/students` into the training.
11. Login as FORMATEUR and open `/attendance` to mark attendance.
12. View progress in student detail; generate a certificate and download/print.
## Prereqs
- Backend running at `http://localhost:8080`
- Use a user with role `RESPONSABLE` (or `ADMIN`) for creation endpoints
- Use `FORMATEUR` for attendance

Set environment variables (PowerShell):
```powershell
$BASE="http://localhost:8080/api"
$TOKEN="PUT_JWT_HERE"
```

## 1) Login (get JWT)
```bash
curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"responsable@astba.tn","password":"demo123"}'
```

## 2) Create Training (AUTO)
```bash
curl -s -X POST "$BASE/trainings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Web Engineering",
    "description": "Auto structure training",
    "creationMode": "AUTO",
    "levelsCount": 4,
    "sessionsPerLevel": 6,
    "startDate": "2026-02-15",
    "endDate": "2026-06-30",
    "status": "active"
  }'
```

## 3) Generate Structure (AUTO only)
```bash
curl -s -X POST "$BASE/trainings/{trainingId}/generate-structure" \
  -H "Authorization: Bearer $TOKEN"
```
Notes: idempotent — calling again returns existing structure.

## 4) Create Training (MANUAL)
```bash
curl -s -X POST "$BASE/trainings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Robotics Basics",
    "description": "Manual structure training",
    "creationMode": "MANUAL",
    "levelsCount": 4,
    "sessionsPerLevel": 6
  }'
```

## 5) Create Level (MANUAL only)
```bash
curl -s -X POST "$BASE/trainings/{trainingId}/levels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "levelIndex": 1, "title": "Level 1" }'
```

## 6) Create Session (MANUAL only)
```bash
curl -s -X POST "$BASE/levels/{levelId}/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionIndex": 1,
    "title": "Intro Session",
    "startAt": "2026-02-20T09:00:00",
    "durationMin": 120,
    "location": "Room A",
    "status": "PLANNED"
  }'
```

## 7) Schedule Update (RESPONSABLE)
```bash
curl -s -X PUT "$BASE/sessions/{sessionId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "startAt": "2026-02-27T09:00:00", "location": "Room B" }'
```

## 8) Read Training Detail (FORMATEUR+)
```bash
curl -s "$BASE/trainings/{trainingId}" \
  -H "Authorization: Bearer $TOKEN"
```

## 8b) AI Plan Draft (AUTO only)
```bash
curl -s -X POST "$BASE/trainings/{trainingId}/ai-plan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promptText": "Build a 4-level plan focused on web development fundamentals.",
    "language": "en",
    "constraints": { "defaultDurationMin": 120, "defaultLocation": "Room A" }
  }'
```

## 8c) Apply AI Plan (AUTO only)
```bash
curl -s -X POST "$BASE/trainings/{trainingId}/apply-ai-plan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "approvedPlan": { ... } }'
```

## 9) Enroll Student (RESPONSABLE)
```bash
curl -s -X POST "$BASE/students" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "firstName":"Nora","lastName":"Ali","email":"nora@demo.tn","training":{"id":{trainingId}} }'
```

## 10) Attendance (FORMATEUR)
```bash
curl -s -X POST "$BASE/attendance/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": {sessionId},
    "date": "2026-02-27",
    "records": [
      { "studentId": {studentId}, "status": "present" }
    ]
  }'
```

## 11) Progress + Certificate
```bash
curl -s "$BASE/students/{studentId}/progress" -H "Authorization: Bearer $TOKEN"
```
```bash
curl -s -X POST "$BASE/certificates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "studentId": {studentId}, "trainingId": {trainingId} }'
```

## Structure Lock Check
If attendance exists for any session in a training, structure updates return 409:
- `POST /api/trainings/{id}/generate-structure`
- `POST /api/trainings/{id}/levels`
- `POST /api/levels/{levelId}/sessions`

Scheduling updates are still allowed while locked.
