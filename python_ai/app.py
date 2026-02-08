from flask import Flask, jsonify, request
import math
import re
import unicodedata

app = Flask(__name__)

ROLE_KEYWORDS = {
    "FORMATEUR": [
        "formation",
        "formateur",
        "enseignement",
        "pedagogie",
        "cours",
        "atelier",
        "coach",
        "education",
        "eleves",
        "classe",
        "animation",
        "didactique",
        "evaluation",
    ],
    "RESPONSABLE": [
        "responsable",
        "coordination",
        "gestion",
        "planning",
        "pilotage",
        "supervision",
        "administration",
        "strategie",
        "reporting",
        "management",
        "organisation",
        "budget",
    ],
}


def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    return text.lower()


def tokenize(text: str) -> set:
    cleaned = normalize_text(text)
    tokens = re.split(r"[^a-z0-9]+", cleaned)
    return {token for token in tokens if len(token) >= 3}


def compute_score(description: str, admin_tokens: set, role_tokens: set) -> float:
    desc_tokens = tokenize(description or "")
    if not desc_tokens:
        return 0.0
    score_admin = 0.0
    score_role = 0.0
    if admin_tokens:
        overlap = len(desc_tokens & admin_tokens)
        score_admin = overlap / max(1, len(admin_tokens))
    if role_tokens:
        overlap = len(desc_tokens & role_tokens)
        score_role = overlap / max(1, len(role_tokens))
    return max(score_admin, score_role) if admin_tokens else score_role


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/filter")
def filter_applications():
    payload = request.get_json(silent=True) or {}
    admin_choice = payload.get("adminChoice") or ""
    role_choice = (payload.get("role") or "").strip().upper()
    min_score = payload.get("minScore")
    try:
        min_score = float(min_score) if min_score is not None else 0.3
    except (TypeError, ValueError):
        min_score = 0.3

    items = payload.get("items") or []

    admin_tokens = tokenize(admin_choice)
    role_tokens = set(ROLE_KEYWORDS.get(role_choice, []))

    results = []
    for item in items:
        item_id = item.get("id")
        description = item.get("careerDescription") or ""
        item_role = (item.get("role") or "").strip().upper()
        item_role_tokens = set(ROLE_KEYWORDS.get(item_role, []))
        score = compute_score(description, admin_tokens, role_tokens | item_role_tokens)
        matched = score >= min_score
        results.append(
            {
                "id": item_id,
                "score": round(score, 4),
                "matched": matched,
            }
        )

    return jsonify({"results": results, "minScore": min_score})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)

