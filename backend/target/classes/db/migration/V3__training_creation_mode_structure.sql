ALTER TABLE training
    ADD COLUMN creation_mode VARCHAR(20) NOT NULL DEFAULT 'AUTO';

ALTER TABLE training
    ADD COLUMN structure_status VARCHAR(20) NOT NULL DEFAULT 'NOT_GENERATED';

ALTER TABLE sessions
    ADD COLUMN level_id BIGINT;

ALTER TABLE sessions
    ADD COLUMN start_at DATETIME;

ALTER TABLE sessions
    ADD COLUMN duration_min INT;

ALTER TABLE sessions
    ADD COLUMN location VARCHAR(255);

ALTER TABLE sessions
    ADD COLUMN status VARCHAR(50);

ALTER TABLE sessions
    ADD CONSTRAINT fk_sessions_level
        FOREIGN KEY (level_id) REFERENCES levels(id);

ALTER TABLE levels
    ADD CONSTRAINT uk_level_training_level_number
        UNIQUE (training_id, level_number);

ALTER TABLE sessions
    ADD CONSTRAINT uk_session_level_session_number
        UNIQUE (level_id, session_number);
