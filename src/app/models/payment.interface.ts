export enum PaymentStatus {
    PENDING = 'pending',
    DUE_NOW = 'due_now',
    COMPLETED = 'completed'
}

export interface Payment {
    _id: string;
    payee_name: string;
    due_date: Date;
    due_amount: number;
    status: PaymentStatus;
    address: {
        country: string;
        state: string;
        city: string;
    };
    currency: string;
    evidence_file?: string;
    payee_added_date_utc: Date;
    total_due?: number;
}
