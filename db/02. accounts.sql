CREATE TABLE accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL, -- ID User dari payload token JWT
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'CASH', -- 'CASH', 'BANK', 'E_WALLET', 'CREDIT_CARD', 'INVESTMENT'
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    account_number VARCHAR(50) NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    version INT NOT NULL DEFAULT 0,
    -- Audit Trail & Soft Delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(50)
);