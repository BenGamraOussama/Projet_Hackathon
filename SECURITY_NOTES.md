# Security Notes (LLM Feature)

- System instructions and user content are separated. The system prompt contains only fixed rules; user prompt carries USER_DESCRIPTION, CONSTRAINTS_JSON, and LANGUAGE.
- All LLM outputs are strictly parsed as JSON and validated against the JSON Schema before being returned or applied.
- AI endpoints are restricted to the RESPONSABLE role (least privilege).
- Prompt size is limited to 2000 characters and requests are rate-limited per user (5 per minute).
- Audit logs record only safe metadata (event type, training id, language). No prompts, plans, or secrets are stored.
- Apply endpoint re-validates the approved plan against the schema before any DB updates.
