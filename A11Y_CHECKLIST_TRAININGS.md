# Manual A11y Checklist — Trainings UI

Scope: `/trainings/new` and `/trainings/:id`

- Verify each form field has a visible label and required fields show “(required)” in text.
- Tab through the page to confirm all interactive elements are reachable in a logical order.
- Check visible focus on links, buttons, radio inputs, and accordion toggles.
- Ensure the creation mode radio group announces its legend and help text to screen readers.
- Confirm error messages are announced (role="alert") and tied to inputs via `aria-describedby`.
- Open the “Generate structure” dialog and confirm focus is trapped inside the dialog.
- Press `Esc` to close the dialog and confirm focus returns to the trigger button.
- Verify dialog buttons are real `<button>` elements (no div-as-button).
- Expand/collapse each level accordion using keyboard (Enter/Space).
- Confirm session status is communicated with text, not color alone.
- Edit a session schedule using only keyboard input and confirm fields are accessible.
- Test on mobile width to ensure session cards stack and remain readable.
- In AI Assist, confirm the draft form is fully keyboard operable and errors announce clearly.
- Ensure the AI draft summary errors are readable and not color-only.
