CREATE TABLE IF NOT EXISTS training (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(1000),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS levels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    training_id BIGINT,
    level_number INT,
    name VARCHAR(255),
    description VARCHAR(1000),
    CONSTRAINT fk_levels_training
        FOREIGN KEY (training_id) REFERENCES training(id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    training_id BIGINT,
    level_number INT,
    session_number INT,
    title VARCHAR(255),
    CONSTRAINT fk_sessions_training
        FOREIGN KEY (training_id) REFERENCES training(id)
);

CREATE TABLE IF NOT EXISTS student (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    enrollment_date DATE,
    status VARCHAR(50),
    current_level INT,
    training_id BIGINT,
    CONSTRAINT fk_students_training
        FOREIGN KEY (training_id) REFERENCES training(id)
);

CREATE TABLE IF NOT EXISTS attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT,
    session_id BIGINT,
    date DATE,
    status VARCHAR(50),
    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT uk_attendance_student_session
        UNIQUE (student_id, session_id)
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(50),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    CONSTRAINT uk_users_email
        UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    font_size VARCHAR(50),
    contrast VARCHAR(50),
    animations BOOLEAN,
    screen_reader BOOLEAN,
    focus_highlight BOOLEAN,
    line_spacing VARCHAR(50),
    cursor_size VARCHAR(50),
    color_blind_mode VARCHAR(50),
    simplify_ui BOOLEAN,
    updated_at DATETIME,
    CONSTRAINT fk_user_preferences_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_user_preferences_user
        UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT,
    training_id BIGINT,
    certificate_id VARCHAR(255),
    issue_date DATE,
    CONSTRAINT fk_certificates_student
        FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT fk_certificates_training
        FOREIGN KEY (training_id) REFERENCES training(id),
    CONSTRAINT uk_certificates_student_training
        UNIQUE (student_id, training_id),
    CONSTRAINT uk_certificates_certificate_id
        UNIQUE (certificate_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT,
    training_id BIGINT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50),
    notes VARCHAR(1000),
    CONSTRAINT fk_enrollments_student
        FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT fk_enrollments_training
        FOREIGN KEY (training_id) REFERENCES training(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_email VARCHAR(255),
    action VARCHAR(255),
    entity_type VARCHAR(255),
    entity_id VARCHAR(255),
    details VARCHAR(2000),
    created_at DATETIME
);

CREATE TABLE IF NOT EXISTS message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id VARCHAR(255),
    recipient_id VARCHAR(255),
    content VARCHAR(2000),
    timestamp DATETIME,
    is_read BOOLEAN
);
