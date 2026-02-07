ALTER TABLE sessions
    ADD COLUMN objective VARCHAR(500);

ALTER TABLE sessions
    ADD COLUMN modality VARCHAR(50);

ALTER TABLE sessions
    ADD COLUMN materials VARCHAR(2000);

ALTER TABLE sessions
    ADD COLUMN accessibility_notes VARCHAR(2000);
