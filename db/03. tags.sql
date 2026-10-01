CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id VARCHAR(50) NULL,
    name VARCHAR(50) NOT NULL,
    -- Audit Trail & Soft Delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(50)
);

-- SEED TAGS GLOBAL
INSERT INTO
    tags (user_id, name, created_by)
VALUES
    (NULL, 'Kebutuhan Pokok', 'SYSTEM'),
    (NULL, 'Keinginan / Gaya Hidup', 'SYSTEM'),
    (NULL, 'Rutin Bulanan', 'SYSTEM');