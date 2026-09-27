export enum TransactionType {
    INCOME = 'INCOME', // income from external
    EXPENSE = 'EXPENSE', // expense to external, transfer to 3rd account count as EXPENSE
    TRANSFER = 'TRANSFER', // internal account transfer
    ADJUSTMENT = 'ADJUSTMENT' // adjustment balance
}

export enum PaymentMethod {
    CASH = 'CASH',
    BANK = 'BANK',
    E_WALLET = 'E_WALLET',
    CREDIT_CARD = 'CREDIT_CARD',
}