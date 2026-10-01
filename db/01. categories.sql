CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id VARCHAR(50) NULL,
    parent_id BIGINT NULL REFERENCES categories (id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'EXPENSE', -- 'EXPENSE', 'INCOME'
    -- Audit Trail & Soft Delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(50)
);

-- SEED KATEGORI PARENT GLOBAL MASTER (Pengeluaran)
INSERT INTO
    categories (user_id, parent_id, name, type, created_by)
VALUES
    (
        NULL,
        NULL,
        'Makanan & Minuman',
        'EXPENSE',
        'SYSTEM'
    ),
    (NULL, NULL, 'Transportasi', 'EXPENSE', 'SYSTEM'),
    (
        NULL,
        NULL,
        'Tagihan & Utilitas',
        'EXPENSE',
        'SYSTEM'
    ),
    (NULL, NULL, 'Belanja Harian', 'EXPENSE', 'SYSTEM'),
    (NULL, NULL, 'Hiburan & Hobi', 'EXPENSE', 'SYSTEM'),
    (NULL, NULL, 'Kesehatan', 'EXPENSE', 'SYSTEM');

-- SEED SUB-KATEGORI
INSERT INTO
    categories (user_id, parent_id, name, type, created_by)
VALUES
    (NULL, 1, 'Restoran & Cafe', 'EXPENSE', 'SYSTEM'),
    (
        NULL,
        1,
        'Bahan Makanan / Pasar',
        'EXPENSE',
        'SYSTEM'
    ),
    (NULL, 2, 'Bensin / BBM', 'EXPENSE', 'SYSTEM'),
    (
        NULL,
        2,
        'Ojek / Taksi Online',
        'EXPENSE',
        'SYSTEM'
    ),
    (NULL, 2, 'Parkir & Tol', 'EXPENSE', 'SYSTEM'),
    (NULL, 3, 'Listrik & Air', 'EXPENSE', 'SYSTEM'),
    (NULL, 3, 'Internet & Pulsa', 'EXPENSE', 'SYSTEM');

-- SEED KATEGORI PEMASUKAN
INSERT INTO
    categories (user_id, parent_id, name, type, created_by)
VALUES
    (NULL, NULL, 'Gaji', 'INCOME', 'SYSTEM'),
    (
        NULL,
        NULL,
        'Bonus & Tunjangan',
        'INCOME',
        'SYSTEM'
    ),
    (
        NULL,
        NULL,
        'Hasil Investasi / Bunga',
        'INCOME',
        'SYSTEM'
    ),
    (
        NULL,
        NULL,
        'Penjualan / Freelance',
        'INCOME',
        'SYSTEM'
    );
