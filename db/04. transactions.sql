CREATE TABLE transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    destination_account_id BIGINT NULL REFERENCES accounts (id) ON DELETE SET NULL,
    category_id BIGINT NULL REFERENCES categories (id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH',
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    merchant_name VARCHAR(100) NULL,
    description TEXT NULL,
    receipt_image_url VARCHAR(255) NULL,
    note VARCHAR(255) NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    -- Audit Trail & Soft Delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(50) CONSTRAINT check_transfer_destination CHECK (
        (
            type = 'TRANSFER'
            AND destination_account_id IS NOT NULL
            AND account_id <> destination_account_id
        )
        OR (
            type <> 'TRANSFER'
            AND destination_account_id IS NULL
        )
    )
);