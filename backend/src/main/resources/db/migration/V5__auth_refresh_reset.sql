CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name)
    SELECT 'ADMIN' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN');
INSERT INTO roles (name)
    SELECT 'FORMATEUR' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'FORMATEUR');
INSERT INTO roles (name)
    SELECT 'RESPONSABLE' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'RESPONSABLE');
INSERT INTO roles (name)
    SELECT 'ELEVE' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ELEVE');
INSERT INTO roles (name)
    SELECT 'VISITEUR' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'VISITEUR');

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(64) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME,
    replaced_by_id VARCHAR(64),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(64) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
