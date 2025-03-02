from datetime import date
from .models import PaymentStatus

def calculate_total_due(due_amount: float, discount_percent: float = None, tax_percent: float = None) -> float:
    amount = due_amount

    if discount_percent:
        amount -= (amount * (discount_percent / 100))

    if tax_percent:
        amount += (amount * (tax_percent / 100))

    return round(amount, 2)

def update_payment_status(payment: dict) -> None:
    if payment['payee_payment_status'] != PaymentStatus.COMPLETED:
        today = date.today()
        due_date = payment['payee_due_date']

        if due_date < today:
            payment['payee_payment_status'] = PaymentStatus.OVERDUE
        elif due_date == today:
            payment['payee_payment_status'] = PaymentStatus.DUE_NOW
