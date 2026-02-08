# Python AI Filter Service

Simple Flask service that scores job applications based on the career description and the admin's criteria.

## Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Service URL: `http://localhost:5005`

## API

`POST /filter`

Request body:

```json
{
  "adminChoice": "robotique python",
  "role": "FORMATEUR",
  "minScore": 0.3,
  "items": [
    { "id": 1, "careerDescription": "Formateur en robotique", "role": "FORMATEUR" }
  ]
}
```

Response body:

```json
{
  "results": [
    { "id": 1, "score": 0.6667, "matched": true }
  ],
  "minScore": 0.3
}
```

