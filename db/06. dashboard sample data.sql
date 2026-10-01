BEGIN;

DO $$
DECLARE
    sample_user_id VARCHAR(50) := '12260002';
    bank_account_id BIGINT;
    wallet_account_id BIGINT;
BEGIN
    IF sample_user_id = 'REPLACE_WITH_LOGIN_USER_ID' THEN
        RAISE EXCEPTION 'Replace sample_user_id with the userId from your login token';
    END IF;

    DELETE FROM transactions
    WHERE user_id = sample_user_id
      AND description LIKE 'Dashboard sample 2026-%';

    DELETE FROM accounts
    WHERE user_id = sample_user_id
      AND name IN ('Dashboard sample - Main bank', 'Dashboard sample - E-wallet');

    INSERT INTO accounts (user_id, name, type, balance, currency)
    VALUES (sample_user_id, 'Dashboard sample - Main bank', 'BANK', 18500000.00, 'IDR')
    RETURNING id INTO bank_account_id;

    INSERT INTO accounts (user_id, name, type, balance, currency)
    VALUES (sample_user_id, 'Dashboard sample - E-wallet', 'E_WALLET', 1250000.00, 'IDR')
    RETURNING id INTO wallet_account_id;

    INSERT INTO transactions (
        user_id, account_id, destination_account_id, type, payment_method,
        amount, transaction_date, merchant_name, description, note, is_recurring
    ) VALUES
    (sample_user_id, bank_account_id, NULL, 'INCOME', 'BANK', 12500000.00, '2026-08-01 09:00:00+07', 'PT Fintrack Labs', 'Dashboard sample 2026-08 salary', 'August salary', true),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'E_WALLET', 185000.00, '2026-08-02 12:30:00+07', 'Kopi Pagi', 'Dashboard sample 2026-08 coffee', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'CASH', 425000.00, '2026-08-04 18:00:00+07', 'Fresh Market', 'Dashboard sample 2026-08 groceries', NULL, false),
    (sample_user_id, bank_account_id, wallet_account_id, 'TRANSFER', 'BANK', 750000.00, '2026-08-05 08:00:00+07', NULL, 'Dashboard sample 2026-08 wallet top up', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'BANK', 1350000.00, '2026-08-07 10:15:00+07', 'City Fuel', 'Dashboard sample 2026-08 fuel', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'BANK', 625000.00, '2026-08-09 19:30:00+07', 'Family Restaurant', 'Dashboard sample 2026-08 dinner', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'INCOME', 'BANK', 2750000.00, '2026-08-12 14:00:00+07', 'Client Project', 'Dashboard sample 2026-08 freelance', 'Project milestone', false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'BANK', 925000.00, '2026-08-14 11:00:00+07', 'Internet Provider', 'Dashboard sample 2026-08 internet bill', NULL, true),
    (sample_user_id, bank_account_id, wallet_account_id, 'TRANSFER', 'BANK', 1250000.00, '2026-08-16 08:30:00+07', NULL, 'Dashboard sample 2026-08 savings transfer', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'E_WALLET', 315000.00, '2026-08-18 20:00:00+07', 'Movie House', 'Dashboard sample 2026-08 movie', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'BANK', 2400000.00, '2026-08-21 16:00:00+07', 'Home Supplies', 'Dashboard sample 2026-08 home supplies', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'ADJUSTMENT', 'CASH', 175000.00, '2026-08-23 17:00:00+07', NULL, 'Dashboard sample 2026-08 balance adjustment', 'Cash count correction', false),
    (sample_user_id, bank_account_id, NULL, 'INCOME', 'BANK', 12500000.00, '2026-08-25 09:00:00+07', 'PT Fintrack Labs', 'Dashboard sample 2026-08 salary', 'August salary', true),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'CREDIT_CARD', 3850000.00, '2026-08-27 13:45:00+07', 'Electronics Store', 'Dashboard sample 2026-08 electronics', NULL, false),
    (sample_user_id, bank_account_id, wallet_account_id, 'TRANSFER', 'BANK', 500000.00, '2026-08-29 10:00:00+07', NULL, 'Dashboard sample 2026-08 wallet top up', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'CASH', 280000.00, '2026-08-31 12:00:00+07', 'Local Market', 'Dashboard sample 2026-08 groceries', NULL, false),

    (sample_user_id, bank_account_id, NULL, 'INCOME', 'BANK', 12500000.00, '2026-09-01 09:00:00+07', 'PT Fintrack Labs', 'Dashboard sample 2026-09 salary', 'September salary', true),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'E_WALLET', 195000.00, '2026-09-02 12:45:00+07', 'Kopi Pagi', 'Dashboard sample 2026-09 coffee', NULL, false),
    (sample_user_id, bank_account_id, wallet_account_id, 'TRANSFER', 'BANK', 900000.00, '2026-09-04 08:15:00+07', NULL, 'Dashboard sample 2026-09 wallet top up', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'BANK', 1450000.00, '2026-09-06 10:30:00+07', 'City Fuel', 'Dashboard sample 2026-09 fuel', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'CASH', 540000.00, '2026-09-08 18:15:00+07', 'Fresh Market', 'Dashboard sample 2026-09 groceries', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'BANK', 975000.00, '2026-09-10 11:00:00+07', 'Internet Provider', 'Dashboard sample 2026-09 internet bill', NULL, true),
    (sample_user_id, bank_account_id, NULL, 'INCOME', 'BANK', 3850000.00, '2026-09-12 15:00:00+07', 'Client Project', 'Dashboard sample 2026-09 freelance', 'Project delivery', false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'BANK', 825000.00, '2026-09-14 19:00:00+07', 'Family Restaurant', 'Dashboard sample 2026-09 dinner', NULL, false),
    (sample_user_id, bank_account_id, wallet_account_id, 'TRANSFER', 'BANK', 1450000.00, '2026-09-16 08:30:00+07', NULL, 'Dashboard sample 2026-09 savings transfer', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'E_WALLET', 395000.00, '2026-09-18 20:00:00+07', 'Movie House', 'Dashboard sample 2026-09 movie', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'ADJUSTMENT', 'CASH', 125000.00, '2026-09-20 17:00:00+07', NULL, 'Dashboard sample 2026-09 balance adjustment', 'Cash count correction', false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'BANK', 1850000.00, '2026-09-22 16:30:00+07', 'Home Supplies', 'Dashboard sample 2026-09 home supplies', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'INCOME', 'BANK', 12500000.00, '2026-09-25 09:00:00+07', 'PT Fintrack Labs', 'Dashboard sample 2026-09 salary', 'September salary', true),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'CREDIT_CARD', 2950000.00, '2026-09-27 13:00:00+07', 'Sports Store', 'Dashboard sample 2026-09 sports gear', NULL, false),
    (sample_user_id, bank_account_id, wallet_account_id, 'TRANSFER', 'BANK', 650000.00, '2026-09-29 10:00:00+07', NULL, 'Dashboard sample 2026-09 wallet top up', NULL, false),
    (sample_user_id, bank_account_id, NULL, 'EXPENSE', 'CASH', 325000.00, '2026-09-30 12:15:00+07', 'Local Market', 'Dashboard sample 2026-09 groceries', NULL, false);
END $$;

COMMIT;